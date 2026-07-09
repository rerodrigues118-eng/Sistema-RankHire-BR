'use client';

import { useState } from 'react';
import { Sliders, Lock, CreditCard, AlertCircle } from 'lucide-react';
import ProfileConfig from '@/components/ProfileConfig';
import CompanySection from '../CompanySection';

const criteriaConfig = [
  {
    key: 'experience' as const,
    label: 'Experiência profissional',
    description: 'Anos de atuação e cargos relevantes',
  },
  {
    key: 'techStack' as const,
    label: 'Stack tecnológica e ferramentas',
    description: 'Linguagens, frameworks e plataformas',
  },
  {
    key: 'education' as const,
    label: 'Formação acadêmica e certificados',
    description: 'Graduação, pós e certificações reconhecidas',
  },
  {
    key: 'english' as const,
    label: 'Proficiência em inglês',
    description: 'Nível de comunicação escrita e verbal',
  },
  {
    key: 'tooling' as const,
    label: 'Metodologias e habilidades comportamentais',
    description: 'Agile, comunicação, liderança e soft skills',
  },
];

export default function SettingsPage() {
  const [weights, setWeights] = useState({
    experience: 4,
    techStack: 5,
    education: 2,
    english: 3,
    tooling: 4,
  });

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6" style={{ border: '0.5px solid #E2E8F0' }}>
        <ProfileConfig />
      </div>

      {/* Criteria weights card */}
      <div
        className="bg-white rounded-xl p-6"
        style={{ border: '0.5px solid #E2E8F0' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Sliders size={16} style={{ color: '#1B4FD8' }} />
          <h2 className="text-sm font-medium text-gray-800">
            Pesos de avaliação da IA (1 a 5)
          </h2>
        </div>
        <p className="text-xs text-gray-400 mb-6">
          Ajuste a importância de cada critério na análise automática de currículos.
          Valores maiores aumentam o peso do critério no score final.
        </p>

        <div className="space-y-5">
          {criteriaConfig.map((criterion) => (
            <div
              key={criterion.key}
              className="flex items-center justify-between gap-6"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{criterion.label}</p>
                <p className="text-xs text-gray-400">{criterion.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={weights[criterion.key]}
                  onChange={(e) =>
                    handleWeightChange(criterion.key, Number(e.target.value))
                  }
                  className="w-28 h-1 rounded-full appearance-none cursor-pointer"
                  style={{
                    accentColor: '#1B4FD8',
                  }}
                />
                <span
                  className="text-xs font-medium rounded-md px-2 py-0.5 min-w-[32px] text-center"
                  style={{
                    backgroundColor: '#E8EEFB',
                    color: '#1B4FD8',
                  }}
                >
                  {weights[criterion.key]}x
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API credentials card */}
      <div
        className="bg-white rounded-xl p-6"
        style={{ border: '0.5px solid #E2E8F0' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Lock size={16} style={{ color: '#1B4FD8' }} />
          <h2 className="text-sm font-medium text-gray-800">
            API credentials &amp; integrações
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Supabase service key
            </label>
            <input
              type="password"
              disabled
              value="••••••••••••••••••••••••••••••••"
              className="w-full text-sm px-3 py-2 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
              style={{ border: '0.5px solid #E2E8F0' }}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Anthropic API key
            </label>
            <input
              type="password"
              disabled
              value="••••••••••••••••••••••••••••••••"
              className="w-full text-sm px-3 py-2 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
              style={{ border: '0.5px solid #E2E8F0' }}
            />
          </div>
        </div>

        <div
          className="flex items-start gap-2.5 mt-5 rounded-lg p-3.5"
          style={{
            backgroundColor: '#FFFBEA',
            border: '0.5px solid rgba(245, 192, 0, 0.2)',
          }}
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#F5C000' }} />
          <p className="text-xs text-gray-600 leading-relaxed">
            Chaves armazenadas com criptografia AES-256 no Supabase Vault.
            Nenhuma credencial trafega em texto plano.
          </p>
        </div>
      </div>

      {/* Company card (inline) */}
      <CompanySection />

      {/* Billing card */}
      <div
        className="bg-white rounded-xl p-6"
        style={{ border: '0.5px solid #E2E8F0' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <CreditCard size={16} style={{ color: '#1B4FD8' }} />
          <h2 className="text-sm font-medium text-gray-800">
            Plano e faturamento
          </h2>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">Plano Pro mensal</p>
          <span
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{
              backgroundColor: '#E8EEFB',
              color: '#1B4FD8',
            }}
          >
            R$ 380,00 / mês
          </span>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Próximo vencimento: 01 de julho de 2026
        </p>
      </div>
    </div>
  );
}
