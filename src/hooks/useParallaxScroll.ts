"use client";

import { useRef, useEffect, useState, RefObject } from "react";

interface UseParallaxScrollReturn {
  frameIndex: number;
  progress: number;
  isVisible: boolean;
}

/**
 * Lightweight parallax hook WITHOUT framer-motion.
 * Replaces heavier implementation to avoid dependency / high CPU usage.
 * Uses IntersectionObserver + window scroll with requestAnimationFrame.
 */
const useParallaxScroll = (containerRef?: RefObject<HTMLDivElement>): UseParallaxScrollReturn => {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (containerRef?.current) heroRef.current = containerRef.current;
  }, [containerRef]);

  // Respect user preference for reduced motion
  useEffect(() => {
    const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq && mq.matches) return; // do nothing when reduced motion requested

    const el = heroRef.current;
    if (!el) return;

    const onScroll = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const visible = rect.top < viewportHeight && rect.bottom > 0;
        setIsVisible(visible);
        if (!visible) {
          setProgress(0);
          setFrameIndex(0);
          return;
        }
        // progress 0..1 relative to element position in viewport
        const total = viewportHeight + rect.height;
        const offset = Math.min(Math.max(viewportHeight - rect.top, 0), total);
        const p = Math.max(0, Math.min(1, offset / total));
        const rawFrame = p * 45;
        setProgress(rawFrame - Math.floor(rawFrame));
        setFrameIndex(Math.min(45, Math.max(0, Math.floor(rawFrame))));
      });
    };

    // initial
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // intersection observer to set visibility quickly
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting || entry.intersectionRatio > 0);
    });
    observer.observe(el);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      observer.disconnect();
    };
  }, [containerRef]);

  return { frameIndex, progress, isVisible };
};

export { useParallaxScroll };
export type { UseParallaxScrollReturn };
export default useParallaxScroll;
