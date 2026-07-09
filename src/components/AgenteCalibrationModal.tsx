"use client";

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, ArrowRight, Bot, Target } from "lucide-react";

interface AgenteCalibrationModalProps {
  agenteName: string;
  onComplete: () => void;
  onClose: () => void;
}

export default function AgenteCalibrationModal({ agenteName, onComplete, onClose }: AgenteCalibrationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  // Mocks para calibração
  const perfis = [
    {
      id: 1,
      nome: "Carlos Eduardo",
      cargo: "Senior Email Designer",
      empresa: "Agência XPTO",
      cidade: "São Paulo, SP",
      resumo: "Especialista em design de e-mails corporativos, domínio avançado de Figma, HTML/CSS para e-mail e experiência prévia em RD Station.",
      skills: ["Figma", "HTML para Email", "RD Station"]
    },
    {
      id: 2,
      nome: "Mariana Souza",
      cargo: "UX/UI Designer",
      empresa: "Tech Startup",
      cidade: "Remoto",
      resumo: "Designer focada em interfaces web e aplicativos mobile. Trabalha com Figma e Adobe XD, mas tem pouca experiência específica em e-mail marketing.",
      skills: ["Figma", "UX Research", "Prototipagem"]
    },
    {
      id: 3,
      nome: "Lucas Pereira",
      cargo: "Email Marketing Specialist",
      empresa: "E-commerce Global",
      cidade: "Curitiba, PR",
      resumo: "Forte foco na parte de infraestrutura de envio, taxas de abertura e copywriting para e-mail. Não é focado na parte visual/design.",
      skills: ["Copywriting", "Mailchimp", "Klaviyo"]
    }
  ];

  const handleAction = (action: string) => {
    if (currentIndex < perfis.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinishing(true);
      // Simula o tempo de ajuste da IA baseado nas escolhas
      setTimeout(() => {
        onComplete();
      }, 3000);
    }
  };

  const perfil = perfis[currentIndex];

  if (isFinishing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-8 text-center space-y-6">
          <Bot className="w-16 h-16 text-[#635BFF] mx-auto animate-bounce" />
          <div>
            <h3 className="text-[20px] font-bold text-[#111827]">Refinando seu Agente...</h3>
            <p className="text-[14px] text-[#6B7280] mt-2">
              Analisando suas preferências e ajustando os pesos dos critérios e filtros.
            </p>
          </div>
          <div className="w-full bg-[#E5E7EB] rounded-full h-2">
            <div className="bg-[#635BFF] h-2 rounded-full w-3/4 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header Progress */}
        <div className="bg-[#111827] p-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-[#06D6A0]" /> Calibração: {agenteName}
            </h3>
            <p className="text-[12px] text-gray-400 mt-1">
              Perfil {currentIndex + 1} de {perfis.length}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-[13px]">
            Sair
          </button>
        </div>

        {/* Card do Candidato */}
        <div className="p-8 flex-1 bg-[#F9FAFB] flex flex-col items-center justify-center">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6 w-full text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#635BFF] to-[#06D6A0] text-white rounded-full flex items-center justify-center text-[24px] font-bold mx-auto shadow-inner">
              {perfil.nome.charAt(0)}
            </div>
            
            <div>
              <h2 className="text-[20px] font-bold text-[#111827]">{perfil.nome}</h2>
              <p className="text-[14px] font-semibold text-[#374151] mt-1">{perfil.cargo}</p>
              <p className="text-[13px] text-[#6B7280]">{perfil.empresa} · {perfil.cidade}</p>
            </div>

            <p className="text-[14px] text-[#4B5563] italic max-w-sm mx-auto bg-[#F3F4F6] p-3 rounded-lg">
              &quot;{perfil.resumo}&quot;
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {perfil.skills.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-[#E0E7FF] text-[#4338CA] rounded-full text-[12px] font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-white border-t border-[#E5E7EB] space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => handleAction('reject')}
              className="w-14 h-14 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center hover:bg-red-100 transition-colors shadow-sm"
              title="Não é o perfil"
            >
              <ThumbsDown className="w-6 h-6" />
            </button>
            <button 
              onClick={() => handleAction('approve')}
              className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors shadow-sm"
              title="Este é o perfil ideal"
            >
              <ThumbsUp className="w-6 h-6" />
            </button>
          </div>
          <div className="text-center">
            <button 
              onClick={() => handleAction('skip')}
              className="text-[13px] font-semibold text-[#6B7280] hover:text-[#111827] flex items-center justify-center gap-1 mx-auto"
            >
              Pular este perfil <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
