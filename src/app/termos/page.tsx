"use client";

import React from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TermosPage() {
  const dataAtualizacao = new Date('2024-06-03').toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Termos de Serviço</h1>
          <p className="text-slate-600">Última atualização: {dataAtualizacao}</p>
        </div>

        {/* Conteúdo Principal */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Seção 1 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-slate-700">
              Ao se cadastrar e utilizar o RankHire BR, você concorda integralmente com estes Termos de Serviço. Se não concordar com qualquer disposição, não utilize a plataforma. O RankHire BR se reserva o direito de modificar estes termos a qualquer tempo, sendo sua responsabilidade verificar as atualizações periodicamente.
            </p>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Responsabilidade do Recrutador (Controlador de Dados)</h2>
            <div className="bg-amber-50 border-l-4 border-amber-600 p-6 mb-4">
              <div className="flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 mb-2">Responsabilidade Legal Importante</p>
                  <p className="text-amber-800 text-sm">
                    O recrutador é o <strong>controlador dos dados</strong> de candidatos inseridos na plataforma. O RankHire BR atua como <strong>operadora de dados</strong> (conforme Art. 5º, VII da LGPD).
                  </p>
                </div>
              </div>
            </div>
            <p className="text-slate-700">
              Você, como recrutador, é integralmente responsável por:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mt-3">
              <li>Obter base legal para tratamento dos dados de candidatos (consentimento, contrato, interesse legítimo)</li>
              <li>Informar aos candidatos sobre o processamento de seus dados</li>
              <li>Responder a solicitações de direitos dos titulares (acesso, correção, exclusão)</li>
              <li>Garantir exatidão e legalidade dos dados inseridos</li>
              <li>Cumprir com obrigações da LGPD e legislação aplicável</li>
            </ul>
            <p className="text-slate-700 mt-4 text-sm text-red-700 font-semibold">
              O RankHire BR NÃO é responsável pelo uso ilegal ou indevido de dados pessoais de terceiros.
            </p>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Conteúdo do Usuário</h2>
            <p className="text-slate-700 mb-4">
              Todo conteúdo inserido na plataforma (vagas, critérios de seleção, dados de candidatos, arquivos) é de responsabilidade exclusiva do usuário. Isso inclui:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Currículos e dados pessoais de candidatos</li>
              <li>Descrições de vagas</li>
              <li>Critérios de seleção</li>
              <li>Qualquer comunicação realizada através da plataforma</li>
            </ul>
            <p className="text-slate-700 mt-4">
              O RankHire BR não valida a legalidade, veracidade ou propriedade do conteúdo inserido. Contudo, o RankHire BR pode, a seu exclusivo critério, suspender contas que violem a LGPD, leis de discriminação ou estes termos.
            </p>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Exclusão de Conta e Dados</h2>
            <div className="bg-green-50 border-l-4 border-green-600 p-6 mb-4">
              <div className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900 mb-2">Direito de Exclusão Garantido</p>
                  <p className="text-green-800 text-sm">
                    Você pode solicitar a exclusão completa de sua conta e dados a qualquer tempo, sem necessidade de justificativa.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-slate-700 mb-3">
              Para excluir sua conta:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 mb-4">
              <li>Acesse: Configurações → Conta → Excluir Conta</li>
              <li>Ou envie solicitação para: <a href="mailto:privacidade@rankhirebr.com.br" className="text-blue-600 hover:underline">privacidade@rankhirebr.com.br</a></li>
            </ol>
            <p className="text-slate-700">
              <strong>Importante:</strong> A exclusão é <strong>IRREVERSÍVEL</strong>. Todos os dados (vagas, candidatos, configurações) serão permanentemente removidos em até 30 dias. Você ainda terá acesso à plataforma durante este período.
            </p>
            <p className="text-slate-600 text-sm mt-3">
              Dados fiscais e logs de segurança podem ser mantidos conforme obrigações legais (5 anos para fiscalidade, 12 meses para logs).
            </p>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Proibições Expressas</h2>
            <p className="text-slate-700 mb-3">É expressamente proibido:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Inserir dados de candidatos <strong>sem base legal adequada</strong> (consentimento, contrato público)</li>
              <li>Usar a plataforma para <strong>discriminação</strong> baseada em gênero, raça, religião, deficiência ou qualquer característica protegida</li>
              <li>Implementar sistemas de IA ou filtragem automatizada que resultem em <strong>discriminação sistêmica</strong></li>
              <li>Compartilhar acesso da conta com terceiros não autorizados</li>
              <li>Tentar acessar dados de outras empresas ou usuários</li>
              <li>Realizar ataques de negação de serviço (DDoS) ou comprometer a segurança</li>
              <li>Utilizar bots ou scripts para scraping não autorizado</li>
              <li>Revender ou redistribuir acesso à plataforma</li>
            </ul>
            <p className="text-slate-700 mt-4 text-sm text-red-700 font-semibold">
              Violações destas proibições resultarão em suspensão ou encerramento imediato da conta.
            </p>
          </section>

          {/* Seção 6 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Suspensão e Cancelamento</h2>
            <p className="text-slate-700 mb-3">
              O RankHire BR pode suspender ou encerrar sua conta se você:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Violar a LGPD ou legislação aplicável</li>
              <li>Violar direitos de terceiros (propriedade intelectual, privacidade)</li>
              <li>Realizar uso abusivo das APIs ou recursos da plataforma</li>
              <li>Tentar comprometer a segurança ou estabilidade da plataforma</li>
              <li>Descumprir qualquer disposição destes Termos</li>
            </ul>
            <p className="text-slate-700 mt-4">
              <strong>Procedimento:</strong> O RankHire BR fornecerá <strong>aviso prévio de 48 horas</strong>, exceto em casos graves de segurança ou ilegalidade, quando pode actuar imediatamente.
            </p>
            <p className="text-slate-600 text-sm mt-3">
              Após suspensão, você pode contestar a decisão enviando email para: <a href="mailto:privacidade@rankhirebr.com.br" className="text-blue-600 hover:underline">privacidade@rankhirebr.com.br</a>
            </p>
          </section>

          {/* Seção 7 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Privacidade e Proteção de Dados</h2>
            <p className="text-slate-700">
              Consulte nossa <Link href="/privacidade" className="text-blue-600 hover:underline">Política de Privacidade</Link> para informações completas sobre como tratamos seus dados pessoais e dos candidatos, incluindo:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mt-3">
              <li>Dados que coletamos</li>
              <li>Como usamos os dados</li>
              <li>Compartilhamento com terceiros</li>
              <li>Seus direitos (acesso, correção, exclusão)</li>
              <li>Retenção de dados</li>
            </ul>
          </section>

          {/* Seção 8 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Limitações de Responsabilidade</h2>
            <p className="text-slate-700 mb-3">
              O RankHire BR é fornecido "no estado em que se encontra". Na máxima extensão permitida por lei:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Não garantimos disponibilidade 100% sem interrupções</li>
              <li>Não somos responsáveis por perda de dados causada por força maior, falhas de terceiros ou negligência sua</li>
              <li>Sua responsabilidade inclui manter backups de dados importantes</li>
              <li>Não somos responsáveis por consequências indiretas de uso indevido</li>
            </ul>
          </section>

          {/* Seção 9 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Assinatura e Pagamento</h2>
            <p className="text-slate-700 mb-3">
              Ao assinar um plano pago:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Você autoriza cobranças recorrentes no cartão ou método de pagamento fornecido</li>
              <li>Renovações automáticas ocorrem no ciclo de faturação (mensal/anual)</li>
              <li>Você pode cancelar a qualquer momento em: Configurações → Plano → Cancelar</li>
              <li>Acesso é mantido até o fim do período pago</li>
              <li>Não há reembolsos por períodos já pagos</li>
            </ul>
            <p className="text-slate-700 mt-4">
              Todos os valores estão em Real (R$) e não incluem impostos adicionais que possam ser cobrados.
            </p>
          </section>

          {/* Seção 10 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Agente IA e Processamento Automatizado</h2>
            <p className="text-slate-700 mb-3">
              O RankHire BR utiliza inteligência artificial para:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
              <li>Análise de currículos</li>
              <li>Sugestão de candidatos relevantes</li>
              <li>Geração de critérios de seleção</li>
            </ul>
            <p className="text-slate-700 mb-3">
              <strong>Importante sobre decisões automatizadas:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Scores e recomendações são <strong>sugestões, não decisões</strong></li>
              <li>Decisões finais sobre candidatos devem ser tomadas por humanos</li>
              <li>A IA pode apresentar vieses — sempre revise manualmente</li>
              <li>Você é responsável por evitar discriminação em decisões de seleção</li>
            </ul>
          </section>

          {/* Seção 11 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Lei Aplicável e Jurisdição</h2>
            <p className="text-slate-700">
              Estes Termos são regidos pelas leis da <strong>República Federativa do Brasil</strong>, especialmente pela LGPD (Lei nº 13.709/2018). Qualquer disputa será resolvida nos tribunais competentes do Brasil.
            </p>
          </section>

          {/* Seção 12 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Contato</h2>
            <p className="text-slate-700 mb-3">
              Para dúvidas sobre estes Termos ou para reportar violações:
            </p>
            <div className="bg-slate-50 p-4 rounded">
              <p className="font-semibold text-slate-900 mb-2">Email:</p>
              <p className="text-slate-700"><a href="mailto:privacidade@rankhirebr.com.br" className="text-blue-600 hover:underline">privacidade@rankhirebr.com.br</a></p>
            </div>
          </section>

          {/* Links úteis */}
          <div className="bg-slate-50 rounded p-4 mt-8 border-t-2 pt-8">
            <p className="text-slate-700 mb-3 font-semibold">Documentos relacionados:</p>
            <div className="space-y-2">
              <Link href="/privacidade" className="block text-blue-600 hover:underline">
                → Política de Privacidade
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
