"use client";

import React from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function PrivacidadePage() {
  const dataAtualizacao = new Date('2024-06-03').toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Política de Privacidade</h1>
          <p className="text-slate-600">Última atualização: {dataAtualizacao}</p>
        </div>

        {/* Conteúdo Principal */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Seção 1 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Quem Somos</h2>
            <p className="text-slate-700 mb-4">
              <strong>RankHire BR</strong> é uma plataforma de recrutamento com inteligência artificial operada por [Razão Social Aqui]. Somos os controladores dos dados pessoais de nossos usuários e nos comprometemos com a máxima transparência no tratamento de suas informações.
            </p>
            <p className="text-slate-700">
              <strong>Contato do Encarregado de Proteção de Dados (DPO):</strong><br />
              Email: <a href="mailto:privacidade@rankhirebr.com.br" className="text-blue-600 hover:underline">privacidade@rankhirebr.com.br</a><br />
              Disponível para esclarecer dúvidas e exercer direitos previstos na LGPD (Lei Geral de Proteção de Dados).
            </p>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Dados que Coletamos</h2>
            <p className="text-slate-700 mb-4">Durante o uso da plataforma coletamos:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Dados de cadastro:</strong> nome, email, empresa, cargo, telefone</li>
              <li><strong>Dados de uso:</strong> vagas criadas, buscas realizadas, filtros utilizados</li>
              <li><strong>Dados de candidatos:</strong> coletados <strong>exclusivamente pelo recrutador</strong> (você é responsável pela coleta legal)</li>
              <li><strong>Dados de pagamento:</strong> processados pelo Pagar.me (não armazenamos dados de cartão)</li>
              <li><strong>Cookies técnicos:</strong> sessão, preferências (sem rastreamento comercial)</li>
              <li><strong>IP de cadastro:</strong> para comprovação de consentimento</li>
            </ul>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Como Utilizamos Seus Dados</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Prestação do serviço de recrutamento contratado</li>
              <li>Comunicações transacionais (confirmação, faturas, alertas)</li>
              <li>Notificações do Agente IA para sugestões de candidatos</li>
              <li>Melhoria da plataforma com dados anonimizados</li>
              <li>Cumprimento de obrigações legais e regulatórias</li>
              <li>Marketing e novidades (apenas com consentimento explícito)</li>
            </ul>
          </section>

          {/* Seção 4 - IMPORTANTE */}
          <section className="bg-blue-50 border-l-4 border-blue-600 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. NÃO VENDEMOS SEUS DADOS</h2>
            <p className="text-slate-700 font-semibold mb-4">
              O RankHire BR NUNCA vende, aluga, empresta ou compartilha seus dados pessoais com terceiros para fins comerciais.
            </p>
            <p className="text-slate-700">
              <strong>Sobre dados de candidatos:</strong> Quando você insere dados de candidatos na plataforma, você é o controlador desses dados (responsável legal). O RankHire BR atua como operadora de dados. Você é integralmente responsável por obter base legal para o tratamento desses dados de terceiros.
            </p>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Base Legal</h2>
            <p className="text-slate-700 mb-4">O tratamento de seus dados está fundamentado em:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Execução de contrato (Art. 7º, V LGPD):</strong> necessário para prestar o serviço</li>
              <li><strong>Legítimo interesse (Art. 7º, IX LGPD):</strong> melhorar segurança e qualidade da plataforma</li>
              <li><strong>Consentimento (Art. 7º, I LGPD):</strong> para comunicações de marketing (dado explicitamente por você)</li>
            </ul>
          </section>

          {/* Seção 6 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Compartilhamento de Dados (Necessário)</h2>
            <p className="text-slate-700 mb-4">Seus dados podem ser compartilhados com os seguintes parceiros:</p>
            <div className="space-y-3">
              <div className="border-l-2 border-slate-200 pl-4">
                <p className="font-semibold text-slate-900">Supabase (Infraestrutura)</p>
                <p className="text-slate-600 text-sm">Armazenamento seguro dos dados. Contrato de Processamento de Dados (DPA) assinado.</p>
              </div>
              <div className="border-l-2 border-slate-200 pl-4">
                <p className="font-semibold text-slate-900">Groq/DeepSeek (IA)</p>
                <p className="text-slate-600 text-sm">Processamento de análise de candidatos com dados anonimizados.</p>
              </div>
              <div className="border-l-2 border-slate-200 pl-4">
                <p className="font-semibold text-slate-900">Apify (Enriquecimento)</p>
                <p className="text-slate-600 text-sm">Dados públicos do LinkedIn para enriquecimento (com sua autorização).</p>
              </div>
              <div className="border-l-2 border-slate-200 pl-4">
                <p className="font-semibold text-slate-900">Brevo (Email)</p>
                <p className="text-slate-600 text-sm">Envio de emails transacionais e de marketing.</p>
              </div>
              <div className="border-l-2 border-slate-200 pl-4">
                <p className="font-semibold text-slate-900">Pagar.me (Pagamentos)</p>
                <p className="text-slate-600 text-sm">Processamento de pagamentos. Não armazenamos dados de cartão.</p>
              </div>
            </div>
          </section>

          {/* Seção 7 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Seus Direitos (LGPD)</h2>
            <p className="text-slate-700 mb-4">Você tem direito a:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Confirmação:</strong> de que seus dados estão sendo processados</li>
              <li><strong>Acesso:</strong> a todos os seus dados armazenados</li>
              <li><strong>Correção:</strong> de dados incompletos ou desatualizados</li>
              <li><strong>Anonimização ou eliminação:</strong> dos seus dados</li>
              <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
              <li><strong>Revogação do consentimento:</strong> a qualquer momento</li>
              <li><strong>Oposição:</strong> ao tratamento em determinadas situações</li>
            </ul>
            <p className="text-slate-700 mt-4">
              Para exercer qualquer desses direitos, envie um email para: <a href="mailto:privacidade@rankhirebr.com.br" className="text-blue-600 hover:underline">privacidade@rankhirebr.com.br</a>
            </p>
            <p className="text-slate-600 text-sm mt-2">
              Prazo de resposta: 15 dias úteis (conforme LGPD).
            </p>
          </section>

          {/* Seção 8 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Retenção de Dados</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Durante a conta ativa:</strong> mantemos seus dados enquanto usar a plataforma</li>
              <li><strong>Após cancelamento:</strong> 90 dias para backup, depois eliminados permanentemente</li>
              <li><strong>Dados fiscais:</strong> 5 anos (obrigação legal)</li>
              <li><strong>Logs de segurança:</strong> 12 meses</li>
            </ul>
          </section>

          {/* Seção 9 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Cookies</h2>
            <p className="text-slate-700">
              O RankHire BR utiliza apenas <strong>cookies técnicos necessários</strong> para o funcionamento da plataforma (sessão, autenticação, preferências).
            </p>
            <p className="text-slate-700 mt-4">
              NÃO utilizamos cookies de rastreamento, publicidade ou analytics de terceiros sem seu consentimento explícito.
            </p>
          </section>

          {/* Seção 10 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Segurança</h2>
            <p className="text-slate-700">
              Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração ou destruição, incluindo criptografia SSL/TLS, autenticação segura e auditorias regulares.
            </p>
          </section>

          {/* Seção 11 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Alterações na Política</h2>
            <p className="text-slate-700">
              Podemos atualizar esta política a qualquer momento. Em caso de alterações relevantes, você será notificado por email.
            </p>
          </section>

          {/* Footer */}
          <div className="border-t pt-8 mt-8">
            <p className="text-slate-600 text-sm mb-4">
              Se tiver dúvidas sobre nossa Política de Privacidade, entre em contato conosco:
            </p>
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-5 h-5" />
              <a href="mailto:privacidade@rankhirebr.com.br" className="text-blue-600 hover:underline">
                privacidade@rankhirebr.com.br
              </a>
            </div>
          </div>

          {/* Links úteis */}
          <div className="bg-slate-50 rounded p-4 mt-8">
            <p className="text-slate-700 mb-3 font-semibold">Documentos relacionados:</p>
            <div className="space-y-2">
              <Link href="/termos" className="block text-blue-600 hover:underline">
                → Termos de Serviço
              </Link>
              <Link href="/lgpd" className="block text-blue-600 hover:underline">
                → Informações sobre LGPD
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
