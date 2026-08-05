"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, CheckCircle2, X, FileText } from "lucide-react";
import type { Candidate } from "@/lib/types";

interface MeetingsSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onConfirmSchedule: (candidateId: string, scheduledDate: string, scheduledTime: string, notes: string) => void;
}

const AVAILABLE_SLOTS = [
  "08:00", "09:00", "09:30", "10:00", "10:30",
  "11:00", "14:00", "14:30", "15:00", "15:30", "16:00", "17:00",
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
  const [selectedTime, setSelectedTime] = useState<string>("10:00");
  const [notes, setNotes] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !candidate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmSchedule(candidate.id, selectedDate, selectedTime, notes);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setNotes("");
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
          className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registrar Entrevista</h3>
                <p className="text-[11px] text-slate-500">Registro interno — sem link externo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isSuccess ? (
            <div className="py-10 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Entrevista Registrada!</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                A entrevista foi salva no histórico do candidato e o status foi avançado para <strong>Entrevista</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Candidate Summary */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: candidate.avatarColor + "20", color: candidate.avatarColor }}
                >
                  {candidate.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{candidate.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{candidate.role}</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> Data
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Horário
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition cursor-pointer"
                  >
                    {AVAILABLE_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-400" /> Anotações da Entrevista
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Pontos de discussão, competências a avaliar, observações..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Info notice */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-600 flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <p>
                  Ao confirmar, o candidato será movido para <strong>Entrevista</strong> no Pipeline e este registro ficará salvo no histórico do CRM.
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow-sm transition flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Registrar Entrevista
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
