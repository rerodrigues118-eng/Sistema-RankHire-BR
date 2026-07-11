"use client";

import React from 'react';
import Link from 'next/link';
import { Shield, Users, Lock, Mail, Book, CheckCircle2 } from 'lucide-react';

export default function LGPDPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Conformidade com a LGPD</h1>
          <p className="text-slate-600">RankHire BR está totalmente em conformidade com a Lei Geral de Proteção de Dados</p>
        </div>

        {/* Cards Principais */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Responsabilidades Claras</h2>
            </div>
            <p className="text-slate-700">
              Como recrutador, <strong>você é o controlador</strong> dos dados de candidatos. RankHire BR atua como operadora. Você é responsável por obter consentimento válido.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Segurança de Dados</h2>
            </div>
            <p className="text-slate-700">
              Implementamos criptografia SSL/TLS, autenticação segura e auditorias regulares para proteger todos os dados.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Consentimento Explícito</h2>
            </div>
            <p className="text-slate-700">
              Todos os dados são coletados com consentimento explícito. Você controla suas preferências de comunicação.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Book className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Transparência Total</h2>
            </div>
            <p className="text-slate-700">
              Nossa Política de Privacidade é clara e acessível. Explicitamos como seus dados são usados e compartilhados.
            </p>
          </div>
        </div>

        {/* Seção de Direitos */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            Seus Direitos LGPD
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-slate-900">Direito de Acesso</h3>
                <p className="text-slate-600 text-sm">Solicite todos os seus dados processados a qualquer tempo.</p>
              </div>
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-slate-900">Direito de Correção</h3>
                <p className="text-slate-600 text-sm">Corrija dados incompletos ou desatualizados imediatamente.</p>
              </div>
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-slate-900">Direito de Exclusão</h3>
                <p className="text-slate-600 text-sm">Solicite a exclusão completa de sua conta em até 30 dias.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-slate-900">Direito de Portabilidade</h3>
                <p className="text-slate-600 text-sm">Receba seus dados em formato estruturado e transferível.</p>
              </div>
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-slate-900">Revogação de Consentimento</h3>
                <p className="text-slate-600 text-sm">Retire seu consentimento de marketing a qualquer momento.</p>
              </div>
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-slate-900">Direito de Oposição</h3>
                <p className="text-slate-600 text-sm">Oponha-se ao tratamento em situações específicas.</p>
              </div>
            </div>
          </div>

          <p className="text-slate-700 mt-6 text-sm">
            <strong>Como exercer seus direitos:</strong> Envie um email para <a href="mailto:privacidade@rankhirebr.com.br" className="text-blue-600 hover:underline">privacidade@rankhirebr.com.br</a> com sua solicitação. Responderemos em até 15 dias úteis.
          </p>
        </div>

        {/* Seção de Dados do Candidato */}
        <div className="bg-amber-50 border-l-4 border-amber-600 rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">⚠️ Importante: Dados de Candidatos</h2>
          <p className="text-slate-700 mb-4">
            Quando você insere dados de candidatos no RankHire BR, você é o <strong>controlador legal</strong> desses dados. Isso significa:
          </p>
          <ul className="space-y-3 text-slate-700">
            <li className="flex gap-3">
              <span className="text-amber-600 font-bold">✓</span>
              <span><strong>Você é responsável</strong> por obter consentimento válido dos candidatos antes de inserir seus dados.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-600 font-bold">✓</span>
              <span><strong>Você deve informar</strong> aos candidatos que seus dados serão processados pelo RankHire BR.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-600 font-bold">✓</span>
              <span><strong>Você responde</strong> às solicitações de direitos dos candidatos (acesso, exclusão, etc.).</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-600 font-bold">✓</span>
              <span><strong>O RankHire BR não é responsável</strong> por uso ilegal ou indevido de dados de candidatos.</span>
            </li>
          </ul>
        </div>

        {/* Seção de Contatos */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Entre em Contato</h2>
          <p className="text-slate-700 mb-6">
            Dúvidas? Queremos ajudar. Nosso Encarregado de Proteção de Dados (DPO) está disponível:
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
            <p className="font-semibold text-slate-900 mb-2">Encarregado de Proteção de Dados (DPO)</p>
            <p className="text-slate-700 mb-3">
              <a href="mailto:privacidade@rankhirebr.com.br" className="text-blue-600 hover:underline font-semibold">
                privacidade@rankhirebr.com.br
              </a>
            </p>
            <p className="text-slate-600 text-sm">
              Tempo de resposta: até 15 dias úteis conforme LGPD.
            </p>
          </div>
        </div>

        {/* Seção de Documentos */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Documentos Legais</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/privacidade" className="block p-4 border rounded-lg hover:bg-slate-50 transition">
              <h3 className="font-semibold text-blue-600 mb-2">📄 Política de Privacidade</h3>
              <p className="text-slate-600 text-sm">Conheça como coletamos, usamos e protegemos seus dados.</p>
            </Link>
            <Link href="/termos" className="block p-4 border rounded-lg hover:bg-slate-50 transition">
              <h3 className="font-semibold text-blue-600 mb-2">📋 Termos de Serviço</h3>
              <p className="text-slate-600 text-sm">Entenda seus direitos e responsabilidades na plataforma.</p>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-600">
          <p>
            RankHire BR está comprometido com a privacidade e proteção de dados de todos os usuários.
          </p>
          <p className="text-sm mt-2">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}
