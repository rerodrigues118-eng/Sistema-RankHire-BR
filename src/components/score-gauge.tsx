"use client";

import React from "react";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * Circular SVG gauge — yellow ring (#F5C000) with score centered.
 * stroke-dasharray = circumference (2πr), stroke-dashoffset proportional to score.
 */
export default function ScoreGauge({
  score,
  maxScore = 5,
  size = 48,
  strokeWidth = 3,
}: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / maxScore;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          {/* Yellow fill arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#F5C000"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Score number centered */}
        <span
          className="absolute inset-0 flex items-center justify-center text-[12px] font-medium text-gray-800"
          style={{ letterSpacing: "-0.02em" }}
        >
          {score.toFixed(1)}
        </span>
      </div>
      <span className="text-[8px] text-gray-400 mt-1 uppercase tracking-wider">
        Score IA
      </span>
    </div>
  );
}
