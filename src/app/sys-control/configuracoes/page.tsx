"use client";

import React, { useState } from "react";
import { Settings, Webhook, Key, Database, Mail, Save, AlertCircle } from "lucide-react";

export default function AdminConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("n8n");

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-[24px] font-bold text-[#111827]">Configurações da Plataforma</h2>
        <p className="text-[#6B7280] text-[14px] mt-1">Gerencie chaves de API, webhooks e integrações do sistema.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          <button 
            onClick={() => setActiveTab('n8n')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-semibold transition-colors ${activeTab === 'n8n' ? 'bg-[#111827] text-white' : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]'}`}
          >
            <Webhook className="w-4 h-4" /> Integração n8n
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-semibold transition-colors ${activeTab === 'api' ? 'bg-[#111827] text-white' : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]'}`}
          >
            <Key className="w-4 h-4" /> Chaves de API Globais
          </button>
          <button 
            onClick={() => setActiveTab('email')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-semibold transition-colors ${activeTab === 'email' ? 'bg-[#111827] text-white' : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]'}`}
          >
            <Mail className="w-4 h-4" /> Config. de E-mail (Brevo)
          </button>
          <button 
            onClick={() => setActiveTab('db')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-semibold transition-colors ${activeTab === 'db' ? 'bg-[#111827] text-white' : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]'}`}
          >
            <Database className="w-4 h-4" /> Supabase
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-[#E5E7EB] rounded-xl shadow-sm min-h-[400px]">
          
          {activeTab === 'n8n' && (
            <div className="p-6 space-y-6">
              <div className="border-b border-[#E5E7EB] pb-4">
                <h3 className="text-[16px] font-bold text-[#111827]">Webhooks do n8n</h3>
                <p className="text-[13px] text-[#6B7280] mt-1">Configure as URLs dos webhooks para automações de e-mail e processamento.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#374151]">Webhook: Lembrete de Trial Expirando</label>
                  <input type="url" defaultValue="https://n8n.srv1695139.hstgr.cloud/webhook-test/rankhire-admin-emails" className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-[13px] font-mono focus:outline-none focus:border-[#06D6A0] focus:ring-1 focus:ring-[#06D6A0]" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#374151]">Webhook: Boas-vindas Novo Cliente</label>
                  <input type="url" defaultValue="https://n8n.srv1695139.hstgr.cloud/webhook-test/rankhire-welcome" className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-[13px] font-mono focus:outline-none focus:border-[#06D6A0] focus:ring-1 focus:ring-[#06D6A0]" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#374151]">Webhook: Suspensão de Conta (Stripe Failed)</label>
                  <input type="url" placeholder="https://..." className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-[13px] font-mono focus:outline-none focus:border-[#06D6A0] focus:ring-1 focus:ring-[#06D6A0]" />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] text-white font-bold text-[13px] rounded-lg flex items-center gap-2 transition-colors">
                  <Save className="w-4 h-4" /> Salvar Webhooks
                </button>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="p-6 space-y-6">
              <div className="border-b border-[#E5E7EB] pb-4">
                <h3 className="text-[16px] font-bold text-[#111827]">Chaves de API Globais</h3>
                <p className="text-[13px] text-[#6B7280] mt-1">Essas chaves são usadas por toda a plataforma. Mantenha-as seguras.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5 relative">
                  <label className="text-[13px] font-semibold text-[#374151]">Stripe Secret Key</label>
                  <input type="password" defaultValue="sk_live_1234567890abcdef" className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[13px] font-mono focus:outline-none focus:border-[#06D6A0]" />
                </div>
                
                <div className="space-y-1.5 relative">
                  <label className="text-[13px] font-semibold text-[#374151]">Stripe Webhook Secret</label>
                  <input type="password" defaultValue="whsec_1234567890abcdef" className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[13px] font-mono focus:outline-none focus:border-[#06D6A0]" />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-[13px] font-semibold text-[#374151]">OpenAI API Key (Extração CVs)</label>
                  <input type="password" defaultValue="sk-proj-1234567890abcdef" className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[13px] font-mono focus:outline-none focus:border-[#06D6A0]" />
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-[13px]">Alterar chaves de API em produção pode causar indisponibilidade imediata nas funcionalidades de extração e pagamento. Tenha certeza antes de salvar.</p>
              </div>

              <div className="pt-4 flex justify-end">
                <button className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] text-white font-bold text-[13px] rounded-lg flex items-center gap-2 transition-colors">
                  <Save className="w-4 h-4" /> Atualizar Chaves
                </button>
              </div>
            </div>
          )}

          {(activeTab === 'email' || activeTab === 'db') && (
            <div className="p-6 flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <Settings className="w-12 h-12 text-[#D1D5DB] mb-3 animate-spin-slow" />
              <h3 className="text-[16px] font-bold text-[#111827]">Em desenvolvimento</h3>
              <p className="text-[13px] text-[#6B7280] mt-1 max-w-sm">
                As configurações específicas desta seção estarão disponíveis na próxima atualização do sistema.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
