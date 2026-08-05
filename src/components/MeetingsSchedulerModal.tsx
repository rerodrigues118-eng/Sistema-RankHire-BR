"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar, Clock, CheckCircle2, Copy, ExternalLink, X,
  User, Video, Sparkles, Check, Mail
} from "lucide-react";
import type { Candidate, KanbanStatus } from "@/lib/types";

interface MeetingsSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onConfirmSchedule: (candidateId: string, scheduledDate: string, scheduledTime: string) => void;
}

const AVAILABLE_SLOTS = [
  "09:00", "10:30", "14:00", "15:30", "17:00"
];

export default function MeetingsSchedulerModal({
  isOpen,
  onClose,
  candidate,
  onConfirmSchedule,
}: MeetingsSchedulerModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>("14:00");
  const [copied, setCopied] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !candidate) return null;

  const recruiterMeetUrl = `https://rankhire.app/meet/recrutador?candId=${candidate.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(recruiterMeetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmSchedule(candidate.id, selectedDate, selectedTime);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Agendar Entrevista com Candidato</h3>
                <p className="text-xs text-slate-500">Meetings Scheduler (HubSpot Integration)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSuccess ? (
            <div className="py-10 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Reunião Agendada!</h4>
              <p className="text-xs text-slate-600 max-w-xs">
                O convite de calendário foi enviado e o status do candidato no Pipeline foi avançado para <strong>Entrevista</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {/* Candidate Info Summary */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: candidate.avatarColor + "20", color: candidate.avatarColor }}
                  >
                    {candidate.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{candidate.name}</p>
                    <p className="text-xs text-slate-500">{candidate.role} · {candidate.email || "Sem e-mail cadastrado"}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  Fit Score {candidate.score.toFixed(1)}
                </span>
              </div>

              {/* Public Scheduling Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link de Agendamento do Recrutador
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={recruiterMeetUrl}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 transition border border-violet-200"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

              {/* Date & Time Picker */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Data da Entrevista
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Horário Disponível
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-500"
                  >
                    {AVAILABLE_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot} hs (30 min)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sync info banner */}
              <div className="rounded-lg bg-indigo-50/70 border border-indigo-100 p-3 text-[11px] text-indigo-700 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p>
                  Ao confirmar, o convite do Google Calendar / Outlook será enviado com o link da videochamada e o candidato será movido automaticamente para a coluna <strong>Entrevista</strong> no Pipeline.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-md transition flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export const AgendarEntrevistaModal = MeetingsSchedulerModal;
