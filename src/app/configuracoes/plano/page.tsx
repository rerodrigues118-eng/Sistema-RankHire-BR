"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PLANOS, getPlanoAtual } from '@/lib/planos';
import { CreditCard, QrCode, FileText, CheckCircle2 } from 'lucide-react';
// import PagarMe from '@pagarme/pagarme-js';

type EmpresaPlano = {
  id: string;
  nome: string;
  plano: string;
  subscription_status: string;
  current_period_end?: string | null;
  pagarme_subscription_id?: string | null;
  pagarme_customer_id?: string | null;
  trial_expires_at: string;
};

type Fatura = {
  data: string;
  valor: number;
  status: string;
  url_boleto?: string | null;
};

export default function PlanosConfigPage() {
  const [empresa, setEmpresa] = useState<EmpresaPlano | null>(null);
  const [loading, setLoading] = useState(true);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix' | 'boleto'>('credit_card');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // LGPD Consent states
  const [aceitaTermosPlano, setAceitaTermosPlano] = useState(false);
  const [autorizaRecorrencia, setAutorizaRecorrencia] = useState(false);

  // Forms
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // PIX state
  const [pixQrCode, setPixQrCode] = useState('');
  const [pixCopiacola, setPixCopiacola] = useState('');
  
  // Boleto state
  const [boletoUrl, setBoletoUrl] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (usuario?.empresa_id) {
        const { data: emp } = await supabase
          .from('empresas')
          .select('id, nome, plano, status_assinatura, trial_expira_em, pagarme_subscription_id, pagarme_customer_id')
          .eq('id', usuario.empresa_id)
          .single();
        if (emp) setEmpresa({ ...emp, subscription_status: emp.status_assinatura ?? '', trial_expires_at: emp.trial_expira_em ?? '' } as EmpresaPlano);
        
        fetch('/api/pagarme/faturas?empresaId=' + usuario.empresa_id)
          .then(res => res.json())
          .then(data => {
            if (data.faturas) setFaturas(data.faturas);
          });
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSubscribe = async () => {
    if (!selectedPlan || !empresa) return;
    
    // Processamento do pagamento
    if (paymentMethod === 'credit_card') {
      try {
        // Obtenção do token com Pagar.me.js
        // const card = await PagarMe.card.tokenize({...})
        // Envio do token (aqui apenas simulado)
        const res = await fetch('/api/pagarme/assinar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresaId: empresa.id,
            planId: selectedPlan,
            cardToken: 'simulated_tok_123'
          })
        });
        if (res.ok) {
          setFeedback({ type: 'success', text: 'Assinatura ativada com sucesso.' });
        }
      } catch (error) {
        console.error(error);
        setFeedback({ type: 'error', text: 'Erro ao processar pagamento.' });
      }
    } else if (paymentMethod === 'pix') {
      try {
        const res = await fetch('/api/pagarme/assinar-pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ empresaId: empresa.id, planId: selectedPlan })
        });
        const data = await res.json();
        if (data.pix_qr_code) {
          setPixQrCode(data.pix_qr_code_url);
          setPixCopiacola(data.pix_qr_code);
          setFeedback({ type: 'success', text: 'PIX gerado com sucesso.' });
        }
      } catch (error) {
        console.error(error);
        setFeedback({ type: 'error', text: 'Erro ao gerar PIX.' });
      }
    } else if (paymentMethod === 'boleto') {
      try {
        const res = await fetch('/api/pagarme/assinar-boleto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ empresaId: empresa.id, planId: selectedPlan })
        });
        const data = await res.json();
        if (data.boleto_url) {
          setBoletoUrl(data.boleto_url);
          setFeedback({ type: 'success', text: 'Boleto gerado com sucesso.' });
        }
      } catch (error) {
        console.error(error);
        setFeedback({ type: 'error', text: 'Erro ao gerar boleto.' });
      }
    }
  };

  const handleCancel = async () => {
    if (!empresa) return;
    setShowCancelConfirm(false);
    try {
      const res = await fetch('/api/pagarme/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId: empresa.id })
      });
      if (res.ok) {
        setFeedback({ type: 'success', text: 'Assinatura cancelada com sucesso.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Erro ao cancelar assinatura.' });
    }
  }

  if (loading) return <div className="p-8">Carregando...</div>;
  if (!empresa) return <div className="p-8 text-gray-500">Empresa não encontrada.</div>;

  const statusAtual = getPlanoAtual(empresa);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações de Plano e Pagamento</h1>
        <p className="text-gray-500 mt-2">Gerencie sua assinatura e faturas.</p>
      </div>

      {feedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {feedback.text}
        </div>
      )}

      {/* PLANO ATUAL */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="text-sm text-gray-500 font-medium">Plano Atual</p>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-bold text-gray-900 capitalize">{empresa.plano}</h2>
            {statusAtual === 'active' && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">Ativo</span>}
            {statusAtual === 'trial' && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-bold uppercase">Trial</span>}
            {statusAtual === 'expirado' && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold uppercase">Expirado</span>}
          </div>
          {empresa.subscription_status === 'active' && (
            <p className="text-sm text-gray-500 mt-2">
              Próxima cobrança: {empresa.current_period_end ? new Date(empresa.current_period_end).toLocaleDateString() : "—"}
            </p>
          )}
        </div>
        
        <div className="flex gap-3">
          {statusAtual === 'active' ? (
            <>
              <button onClick={() => setShowModal(true)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50">
                Trocar plano
              </button>
              <button onClick={() => setShowCancelConfirm(true)} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50">
                Cancelar plano
              </button>
            </>
          ) : (
            <button onClick={() => setShowModal(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
              Escolher um plano
            </button>
          )}
        </div>
      </div>

      {/* HISTÓRICO DE FATURAS */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Histórico de Faturas</h3>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Valor</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Documento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {faturas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Nenhuma fatura encontrada.</td>
                </tr>
              ) : faturas.map((f, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">{new Date(f.data).toLocaleDateString()}</td>
                  <td className="px-6 py-4">R$ {f.valor.toFixed(2).replace('.', ',')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${f.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {f.url_boleto && <Link href={f.url_boleto} target="_blank" className="text-indigo-600 hover:underline">Ver Boleto</Link>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE PAGAMENTO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Assinar o RankHire BR</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Seleção do Plano */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Escolha seu plano</h3>
                
                {['starter', 'pro', 'agencia'].map(p => (
                  <label key={p} className={`block p-4 border rounded-xl cursor-pointer transition ${selectedPlan === PLANOS[p as keyof typeof PLANOS].pagarme_plan_id ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="plan" 
                          value={PLANOS[p as keyof typeof PLANOS].pagarme_plan_id} 
                          checked={selectedPlan === PLANOS[p as keyof typeof PLANOS].pagarme_plan_id}
                          onChange={(e) => setSelectedPlan(e.target.value)}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="font-bold text-gray-900 text-lg">{PLANOS[p as keyof typeof PLANOS].nome}</span>
                      </div>
                      <span className="font-bold text-indigo-600">R$ {PLANOS[p as keyof typeof PLANOS].preco},00 /mês</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Formulário de Pagamento */}
              <div className="space-y-6 border-l pl-8">
                <h3 className="font-semibold text-gray-900 mb-4">Forma de Pagamento</h3>
                
                <div className="flex border rounded-lg p-1 bg-gray-50 gap-1">
                  <button onClick={() => setPaymentMethod('credit_card')} className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${paymentMethod === 'credit_card' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                    <CreditCard className="w-4 h-4" /> Cartão
                  </button>
                  <button onClick={() => setPaymentMethod('pix')} className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${paymentMethod === 'pix' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                    <QrCode className="w-4 h-4" /> PIX
                  </button>
                  <button onClick={() => setPaymentMethod('boleto')} className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${paymentMethod === 'boleto' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                    <FileText className="w-4 h-4" /> Boleto
                  </button>
                </div>

                {paymentMethod === 'credit_card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número do Cartão</label>
                      <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none" placeholder="0000 0000 0000 0000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome no Cartão</label>
                      <input type="text" value={cardHolder} onChange={e => setCardHolder(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none" placeholder="Como impresso no cartão" />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
                        <input type="text" value={cardExp} onChange={e => setCardExp(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none" placeholder="MM/AA" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input type="text" value={cardCvv} onChange={e => setCardCvv(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none" placeholder="123" />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'pix' && pixQrCode && (
                  <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
                    <Image src={pixQrCode} alt="QR Code PIX" width={192} height={192} className="border rounded-xl" />
                    <p className="text-sm text-gray-500">Escaneie o QR Code ou copie a chave abaixo:</p>
                    <input readOnly value={pixCopiacola} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 text-center" />
                    <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm animate-pulse">
                      <CheckCircle2 className="w-4 h-4" /> Aguardando pagamento...
                    </div>
                  </div>
                )}

                {paymentMethod === 'boleto' && boletoUrl && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center bg-gray-50 rounded-xl border border-gray-200">
                    <FileText className="w-12 h-12 text-gray-400" />
                    <div>
                      <h4 className="font-bold text-gray-900">Boleto gerado com sucesso!</h4>
                      <p className="text-sm text-gray-500 mt-1">Vence em 3 dias úteis</p>
                    </div>
                    <Link href={boletoUrl} target="_blank" className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
                      Abrir Boleto (PDF)
                    </Link>
                  </div>
                )}

                {/* Checkboxes de conformidade LGPD e Cobrança */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={aceitaTermosPlano}
                      onChange={(e) => setAceitaTermosPlano(e.target.checked)}
                      className="mt-1 accent-indigo-600 w-4 h-4 rounded"
                    />
                    <span className="text-xs text-gray-500 leading-snug">
                      Li e aceito os <Link href="/termos" target="_blank" className="text-indigo-600 underline font-medium">Termos de Serviço</Link> e a <Link href="/privacidade" target="_blank" className="text-indigo-600 underline font-medium">Política de Privacidade</Link> (Obrigatório)
                    </span>
                  </label>

                  {paymentMethod === 'credit_card' && (
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autorizaRecorrencia}
                        onChange={(e) => setAutorizaRecorrencia(e.target.checked)}
                        className="mt-1 accent-indigo-600 w-4 h-4 rounded"
                      />
                      <span className="text-xs text-gray-500 leading-snug">
                        Autorizo a cobrança recorrente mensal do plano selecionado no cartão de crédito fornecido até que eu solicite o cancelamento. (Obrigatório)
                      </span>
                    </label>
                  )}
                </div>

                <button 
                  onClick={handleSubscribe} 
                  disabled={
                    !selectedPlan || 
                    (paymentMethod === 'pix' && !!pixQrCode) || 
                    (paymentMethod === 'boleto' && !!boletoUrl) ||
                    !aceitaTermosPlano ||
                    (paymentMethod === 'credit_card' && !autorizaRecorrencia)
                  }
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition mt-4"
                >
                  {paymentMethod === 'credit_card' ? 'Assinar com Cartão' : paymentMethod === 'pix' ? (pixQrCode ? 'Aguardando PIX' : 'Gerar PIX') : (boletoUrl ? 'Boleto Gerado' : 'Gerar Boleto')}
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Cancelar assinatura</h3>
            <p className="text-sm text-gray-600">Você terá acesso até o fim do período já pago.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold">
                Voltar
              </button>
              <button onClick={handleCancel} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold">
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
