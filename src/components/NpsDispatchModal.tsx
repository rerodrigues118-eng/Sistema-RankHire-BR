"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Send, CheckCircle2, X, Sparkles, MessageSquare } from "lucide-react";
import type { Candidate } from "@/lib/types";

interface NpsDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onConfirmSend: (candidateId: string, channel: string) => void;
}

export default function NpsDispatchModal({
  isOpen,
  onClose,
  candidate,
  onConfirmSend,
}: NpsDispatchModalProps) {
  const [channel, setChannel] = useState<string>("email");
  const [isSent, setIsSent] = useState(false);

  if (!isOpen || !candidate) return null;

  const handleSend = () => {
    onConfirmSend(candidate.id, channel);
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
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
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pesquisa de Satisfação (NPS)</h3>
                <p className="text-xs text-slate-500">Service Hub Automação</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSent ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 animate-bounce" />
              </div>
              <h4 className="text-base font-bold text-slate-900">NPS Enviado com Sucesso!</h4>
              <p className="text-xs text-slate-600 max-w-xs">
                O candidato <strong>{candidate.name}</strong> receberá a pesquisa de satisfação por {channel === "email" ? "e-mail" : "WhatsApp"}.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                O processo do candidato <strong>{candidate.name}</strong> foi finalizado. Gostaria de disparar a pesquisa de experiência do candidato (NPS)?
              </p>

              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Canal de Disparo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setChannel("email")}
                    className={`p-3 rounded-xl border text-left text-xs font-medium transition flex flex-col gap-1 ${
                      channel === "email"
                        ? "border-violet-600 bg-violet-50/60 text-violet-900 ring-1 ring-violet-600"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-semibold flex items-center gap-1">✉️ E-mail Automático</span>
                    <span className="text-[11px] text-slate-500">{candidate.email || "candidato@email.com"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel("whatsapp")}
                    className={`p-3 rounded-xl border text-left text-xs font-medium transition flex flex-col gap-1 ${
                      channel === "whatsapp"
                        ? "border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-1 ring-emerald-600"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-semibold flex items-center gap-1">💬 WhatsApp Webhost</span>
                    <span className="text-[11px] text-slate-500">{candidate.phone || "(41) 99999-0000"}</span>
                  </button>
                </div>
              </div>

              {/* Informative Box */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[11px] text-slate-600 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                <span>
                  Coletar feedback fortalece o Employer Branding da sua empresa no RankHire BR e reduz o tempo de contratação.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Pular por enquanto
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Disparar NPS
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
