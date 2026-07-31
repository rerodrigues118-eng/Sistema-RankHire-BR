"use client";

import { useState, useEffect } from "react";
import { CreditCard, Tag, Plus, Trash2, Save, Sparkles } from "lucide-react";
import ProfileConfig from "@/components/ProfileConfig";
import CompanySection from "../CompanySection";

const PRESET_COLORS = [
  { value: "#10B981", label: "Verde" },
  { value: "#3B82F6", label: "Azul" },
  { value: "#F59E0B", label: "Amarelo" },
  { value: "#EF4444", label: "Vermelho" },
  { value: "#8B5CF6", label: "Roxo" },
  { value: "#6B7280", label: "Cinza" },
];

export default function SettingsPage() {
  const [etiquetas, setEtiquetas] = useState<any[]>([]);
  const [loadingEtiquetas, setLoadingEtiquetas] = useState(true);
  const [savingEtiquetaId, setSavingEtiquetaId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3B82F6");

  useEffect(() => {
    async function loadEtiquetas() {
      try {
        const res = await fetch("/api/etiquetas", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setEtiquetas(data.etiquetas || []);
        }
      } catch (err) {
        console.error("Erro ao carregar etiquetas:", err);
      } finally {
        setLoadingEtiquetas(false);
      }
    }
    loadEtiquetas();
  }, []);

  const handleUpdateTag = async (id: string, nome: string, cor: string) => {
    setSavingEtiquetaId(id);
    try {
      const res = await fetch("/api/etiquetas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nome, cor }),
      });
      if (!res.ok) {
        console.error("Erro ao salvar etiqueta");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEtiquetaId(null);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch("/api/etiquetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: newTagName.trim(),
          cor: newTagColor,
          posicao: etiquetas.length,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEtiquetas([...etiquetas, data.etiqueta]);
        setNewTagName("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTag = async (id: string) => {
    try {
      const res = await fetch(`/api/etiquetas?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setEtiquetas(etiquetas.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Profile Config */}
      <div className="bg-white rounded-xl p-6" style={{ border: "0.5px solid #E2E8F0" }}>
        <ProfileConfig />
      </div>

      {/* 2. Custom Labels Management */}
      <div className="bg-white rounded-xl p-6" style={{ border: "0.5px solid #E2E8F0" }}>
        <div className="flex items-center gap-2 mb-1">
          <Tag size={16} style={{ color: "#1B4FD8" }} />
          <h2 className="text-sm font-medium text-gray-800">Etiquetas Personalizadas</h2>
        </div>
        <p className="text-xs text-gray-400 mb-6">
          Personalize as etiquetas e cores que você utiliza para classificar candidatos em sua triagem.
        </p>

        {loadingEtiquetas ? (
          <div className="text-xs text-gray-400">Carregando etiquetas...</div>
        ) : (
          <div className="space-y-6">
            {/* List of tags */}
            <div className="space-y-3">
              {etiquetas.map((tag) => (
                <div key={tag.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex-1 flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: tag.cor }}
                    />
                    <input
                      type="text"
                      value={tag.nome}
                      onChange={(e) => {
                        const next = etiquetas.map((item) =>
                          item.id === tag.id ? { ...item, nome: e.target.value } : item
                        );
                        setEtiquetas(next);
                      }}
                      className="bg-transparent font-medium text-sm text-gray-700 focus:outline-none focus:border-indigo-500 border-b border-transparent w-full"
                    />
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Color picker presets */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-gray-200">
                      {PRESET_COLORS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => {
                            const next = etiquetas.map((item) =>
                              item.id === tag.id ? { ...item, cor: preset.value } : item
                            );
                            setEtiquetas(next);
                            handleUpdateTag(tag.id, tag.nome, preset.value);
                          }}
                          className={`w-4 h-4 rounded-full border transition-transform ${
                            tag.cor === preset.value ? "scale-125 border-gray-900" : "border-transparent"
                          }`}
                          style={{ backgroundColor: preset.value }}
                          title={preset.label}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateTag(tag.id, tag.nome, tag.cor)}
                      disabled={savingEtiquetaId === tag.id}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Salvar alterações"
                    >
                      <Save size={15} />
                    </button>

                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Excluir etiqueta"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Create Tag Form */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Nova etiqueta (ex: Fazer entrevista)"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setNewTagColor(preset.value)}
                      className={`w-4.5 h-4.5 rounded-full border transition-transform ${
                        newTagColor === preset.value ? "scale-115 border-gray-900" : "border-transparent"
                      }`}
                      style={{ backgroundColor: preset.value }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus size={15} /> Adicionar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Company section (inline) */}
      <CompanySection />

      {/* 4. Billing card */}
      <div className="bg-white rounded-xl p-6" style={{ border: "0.5px solid #E2E8F0" }}>
        <div className="flex items-center gap-2 mb-5">
          <CreditCard size={16} style={{ color: "#1B4FD8" }} />
          <h2 className="text-sm font-medium text-gray-800">Plano e faturamento</h2>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">Consulte e gerencie seu plano corporativo.</p>
          <a
            href="/configuracoes/plano"
            className="text-xs font-semibold px-4 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            Gerenciar Assinatura
          </a>
        </div>
      </div>
    </div>
  );
}
