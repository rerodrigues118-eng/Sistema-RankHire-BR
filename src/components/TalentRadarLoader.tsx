"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Radar, Cpu } from "lucide-react";

interface TalentRadarLoaderProps {
  message?: string;
  subtext?: string;
  progress?: number;
  className?: string;
}

export default function TalentRadarLoader({
  message = "Varrendo base de talentos...",
  subtext = "Processando perfis, cruzando critérios da vaga e aplicando inteligência artificial",
  progress,
  className = "",
}: TalentRadarLoaderProps) {
  return (
    <div className={`relative flex flex-col items-center justify-center p-8 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 via-white to-violet-50/30 shadow-sm text-center ${className}`}>
      {/* Background Pulse Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <motion.div
          animate={{ scale: [0.8, 1.8, 0.8], opacity: [0.3, 0.05, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-64 h-64 rounded-full border border-indigo-400 bg-indigo-200/20"
        />
        <motion.div
          animate={{ scale: [0.9, 2.2, 0.9], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute w-80 h-80 rounded-full border border-violet-400 bg-violet-200/10"
        />
      </div>

      {/* Animated Central Radar Icon */}
      <div className="relative mb-6">
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-1 rounded-xl border border-white/30 border-t-white flex items-center justify-center"
          >
            <Radar className="w-9 h-9 text-white/90" />
          </motion.div>
          
          <motion.div
            animate={{ scale: [0.9, 1.15, 0.9] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 p-2 bg-white/20 backdrop-blur-md rounded-xl"
          >
            <Sparkles className="w-6 h-6 text-yellow-300 fill-yellow-300" />
          </motion.div>
        </div>

        {/* Floating Mini Badges */}
        <motion.div
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-2 -right-6 bg-white border border-indigo-100 shadow-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-indigo-700 flex items-center gap-1"
        >
          <Cpu className="w-3 h-3 text-indigo-500" /> IA Ativa
        </motion.div>
      </div>

      {/* Breathing Text Header */}
      <motion.h4
        animate={{ opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 justify-center"
      >
        {message}
      </motion.h4>

      {/* Subtext */}
      <p className="mt-1.5 text-xs text-slate-500 max-w-md leading-relaxed">
        {subtext}
      </p>

      {/* Progress Bar (Determinate or Infinite) */}
      <div className="mt-5 w-full max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60 relative">
        {progress !== undefined ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full"
          />
        ) : (
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-1/2 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-full shadow-sm"
          />
        )}
      </div>

      {/* Live Status indicator */}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        Sincronizando com HubSpot & ATS Hubs...
      </div>
    </div>
  );
}
