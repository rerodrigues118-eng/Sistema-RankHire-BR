"use client";

import React from "react";
import type { Candidate } from "@/lib/types";
import { getAvatarBg } from "@/lib/mock-data";
import ScoreGauge from "./score-gauge";
import { Star, Link, Eye } from "lucide-react";

interface CandidateCardProps {
  candidate: Candidate;
  onToggleShortlist: (id: string) => void;
  onViewDetails: (candidate: Candidate) => void;
}

export default function CandidateCard({
  candidate,
  onToggleShortlist,
  onViewDetails,
}: CandidateCardProps) {
  const bg = getAvatarBg(candidate.avatarColor);

  return (
    <div
      className="bg-white p-4 rounded-xl flex items-center justify-between transition-all duration-200 hover:border-[#1B4FD8] group"
      style={{ border: "0.5px solid #E2E8F0" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#1B4FD8")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
    >
      {/* Left: avatar + info + tags */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Circular avatar with initials */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-medium flex-shrink-0"
          style={{ backgroundColor: bg, color: candidate.avatarColor }}
        >
          {candidate.initials}
        </div>

        <div className="min-w-0">
          <p className="text-[13px] font-medium text-gray-900 truncate">
            {candidate.name}
          </p>
          <p className="text-[11px] text-gray-500 truncate">
            {candidate.role} · {candidate.company} · {candidate.city}
          </p>

          {/* Tags row */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {candidate.etiqueta && (
              <span
                className="px-2 py-[2px] rounded-[3px] text-[10px] inline-flex items-center"
                style={{ backgroundColor: candidate.etiqueta.cor, color: '#fff' }}
              >
                {candidate.etiqueta.nome}
              </span>
            )}
            {candidate.confirmedTags.map((t) => (
              <span
                key={t}
                className="bg-[#E8EEFB] text-[#1B4FD8] px-2 py-[2px] rounded-[3px] text-[10px] inline-flex items-center gap-0.5"
              >
                {t} <span className="text-[9px]">✓</span>
              </span>
            ))}
            {candidate.partialTags.map((t) => (
              <span
                key={t}
                className="bg-[#FFFBEA] text-[#C49500] px-2 py-[2px] rounded-[3px] text-[10px]"
              >
                {t} parcial
              </span>
            ))}
            {candidate.otherTags.map((t) => (
              <span
                key={t}
                className="bg-gray-100 text-gray-500 px-2 py-[2px] rounded-[3px] text-[10px]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: gauge + action buttons */}
      <div className="flex items-center gap-5 flex-shrink-0 ml-4">
        <ScoreGauge score={candidate.score} />

        {/* Action icon buttons */}
        <div className="flex items-center gap-1">
          {/* Star shortlist */}
          <button
            onClick={() => onToggleShortlist(candidate.id)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-50 transition-colors"
            style={{ border: "0.5px solid #E2E8F0" }}
            title={candidate.shortlist ? "Remover do shortlist" : "Adicionar ao shortlist"}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                candidate.shortlist
                  ? "fill-[#F5C000] text-[#F5C000]"
                  : "text-gray-400"
              }`}
              strokeWidth={1.6}
            />
          </button>

          {/* Link */}
          <a
            href={candidate.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-[#1B4FD8] hover:bg-gray-50 transition-colors"
            style={{ border: "0.5px solid #E2E8F0" }}
          >
            <Link className="w-3.5 h-3.5" strokeWidth={1.6} />
          </a>

          {/* Eye / details */}
          <button
            onClick={() => onViewDetails(candidate)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            style={{ border: "0.5px solid #E2E8F0" }}
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  );
}
