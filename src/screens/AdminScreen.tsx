import React, { useState } from 'react';
import {
  BLUEPRINT_LIMITS,
  formatBrl,
  getSubscriptionState,
  SubscriptionPlan,
  UserSubscription,
} from '../types';
import { STRINGS } from '../strings';
import { Toolbar } from '../components/Toolbar';

interface AdminScreenProps {
  plans: SubscriptionPlan[];
  subscriptions: UserSubscription[];
  nowMs: number;
  onCreateSubscription: (data: {
    userEmail: string;
    username: string;
    password: string;
    planName: string;
    daysOfUse: number;
    monthlyPriceBrl: number;
    totalPriceBrl: number;
  }) => Promise<void>;
  onRenewSubscription: (sub: UserSubscription, addDays: number) => Promise<void>;
  onToggleBlockSubscription: (sub: UserSubscription) => Promise<void>;
  onResetSubscriptionPassword: (sub: UserSubscription, newPass: string) => Promise<void>;
  onDeleteSubscription: (subId: string) => Promise<void>;
  onCreatePlan: (data: {
    name: string;
    daysOfUse: number;
    monthlyPriceBrl: number;
    totalPriceBrl: number;
  }) => Promise<void>;
  onSeedDefaultPlans: () => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
  onBack: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  plans,
  subscriptions,
  nowMs,
  onCreateSubscription,
  onRenewSubscription,
  onToggleBlockSubscription,
  onResetSubscriptionPassword,
  onDeleteSubscription,
  onCreatePlan,
  onSeedDefaultPlans,
  onDeletePlan,
  onBack,
}) => {
  const [tab, setTab] = useState<'users' | 'plans'>('users');
  const [userEmail, setUserEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [planName, setPlanName] = useState('Mensal');
  const [daysOfUse, setDaysOfUse] = useState('30');
  const [monthlyPriceBrl, setMonthlyPriceBrl] = useState('29.90');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Plan form state
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDays, setNewPlanDays] = useState('30');
  const [newPlanMonthly, setNewPlanMonthly] = useState('29.90');

  // Inline password reset state
  const [editingPassSubId, setEditingPassSubId] = useState<string | null>(null);
  const [resetPassValue, setResetPassValue] = useState('');

  const selectPlanPreset = (plan: SubscriptionPlan) => {
    setPlanName(plan.name);
    setDaysOfUse(String(plan.daysOfUse));
    setMonthlyPriceBrl(String(plan.monthlyPriceBrl));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFeedback('');

    const cleanEmail = userEmail.trim().toLowerCase();
    const cleanUsername = username.trim();
    const daysNum = Number(daysOfUse);
    const monthlyNum = Number(monthlyPriceBrl.replace(',', '.'));

    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length > BLUEPRINT_LIMITS.emailMax) {
      setError('Informe um e-mail Google válido.');
      return;
    }
    if (
      cleanUsername.length < BLUEPRINT_LIMITS.usernameMin ||
      cleanUsername.length > BLUEPRINT_LIMITS.usernameMax ||
      !BLUEPRINT_LIMITS.usernamePattern.test(cleanUsername)
    ) {
      setError('Usuário deve ter 3 a 40 caracteres (letras, números, _, . ou -).');
      return;
    }
    if (password.length < 4 || password.length > 64) {
      setError('A senha deve ter entre 4 e 64 caracteres.');
      return;
    }
    if (!Number.isFinite(daysNum) || daysNum < BLUEPRINT_LIMITS.daysMin || daysNum > BLUEPRINT_LIMITS.daysMax) {
      setError('Dias de uso deve estar entre 1 e 3650.');
      return;
    }
    if (!Number.isFinite(monthlyNum) || monthlyNum < 0 || monthlyNum > BLUEPRINT_LIMITS.monthlyPriceMax) {
      setError('Valor mensal em R$ inválido.');
      return;
    }

    const totalNum = Number(((monthlyNum / 30) * daysNum).toFixed(2));

    setBusy(true);
    try {
      await onCreateSubscription({
        userEmail: cleanEmail,
        username: cleanUsername,
        password,
        planName: planName.trim() || `${daysNum} dias`,
        daysOfUse: Math.round(daysNum),
        monthlyPriceBrl: monthlyNum,
        totalPriceBrl: totalNum,
      });
      setUserEmail('');
      setUsername('');
      setPassword('');
      setFeedback('Usuário cadastrado com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar assinatura.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFeedback('');
    const nameTrim = newPlanName.trim();
    const daysNum = Number(newPlanDays);
    const monthlyNum = Number(newPlanMonthly.replace(',', '.'));

    if (nameTrim.length < BLUEPRINT_LIMITS.planNameMin || nameTrim.length > BLUEPRINT_LIMITS.planNameMax) {
      setError('Nome do plano deve ter entre 2 e 60 caracteres.');
      return;
    }
    if (!Number.isFinite(daysNum) || daysNum < 1 || daysNum > 3650) {
      setError('Dias de uso inválido.');
      return;
    }
    if (!Number.isFinite(monthlyNum) || monthlyNum < 0 || monthlyNum > 100000) {
      setError('Valor mensal inválido.');
      return;
    }

    const totalNum = Number(((monthlyNum / 30) * daysNum).toFixed(2));
    setBusy(true);
    try {
      await onCreatePlan({
        name: nameTrim,
        daysOfUse: Math.round(daysNum),
        monthlyPriceBrl: monthlyNum,
        totalPriceBrl: totalNum,
      });
      setNewPlanName('');
      setFeedback('Plano criado com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar plano.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-[#FAFAFA]">
      <Toolbar title={STRINGS.appName} showBack onBack={onBack} />

      {/* Tabs */}
      <div className="flex border-b border-neutral-300 bg-white">
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`flex-1 cursor-pointer py-2.5 text-[14px] font-medium uppercase ${
            tab === 'users'
              ? 'border-b-2 border-[#B80000] text-[#B80000]'
              : 'text-neutral-600'
          }`}
        >
          Usuários ({subscriptions.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('plans')}
          className={`flex-1 cursor-pointer py-2.5 text-[14px] font-medium uppercase ${
            tab === 'plans'
              ? 'border-b-2 border-[#B80000] text-[#B80000]'
              : 'text-neutral-600'
          }`}
        >
          Planos R$ ({plans.length})
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3 text-[#212121]">
        {error && <p className="rounded bg-red-50 p-2 text-[13px] text-[#CC0000]">{error}</p>}
        {feedback && (
          <p className="rounded bg-green-50 p-2 text-[13px] text-[#008A05]">{feedback}</p>
        )}

        {tab === 'users' && (
          <>
            <form
              onSubmit={handleAddUser}
              className="space-y-2.5 rounded border border-neutral-300 bg-white p-3 shadow-sm"
            >
              <p className="text-[15px] font-bold text-[#008A05]">
                Novo Usuário com Dias e Valor (R$/mês)
              </p>

              {plans.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPlanPreset(p)}
                      className="cursor-pointer rounded bg-neutral-200 px-2 py-1 text-[11px] font-medium hover:bg-neutral-300"
                    >
                      {p.name} ({p.daysOfUse}d - {formatBrl(p.monthlyPriceBrl)}/mês)
                    </button>
                  ))}
                </div>
              )}

              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="E-mail Google do cliente"
                className="w-full border-b border-neutral-400 bg-transparent px-1 py-1 text-[14px] focus:border-[#008A05] focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuário"
                  className="border-b border-neutral-400 bg-transparent px-1 py-1 text-[14px] focus:border-[#008A05] focus:outline-none"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="border-b border-neutral-400 bg-transparent px-1 py-1 text-[14px] focus:border-[#008A05] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Nome do plano"
                  className="border-b border-neutral-400 bg-transparent px-1 py-1 text-[14px] focus:border-[#008A05] focus:outline-none"
                />
                <input
                  type="number"
                  value={daysOfUse}
                  onChange={(e) => setDaysOfUse(e.target.value)}
                  placeholder="Dias"
                  className="border-b border-neutral-400 bg-transparent px-1 py-1 text-[14px] focus:border-[#008A05] focus:outline-none"
                />
                <input
                  type="text"
                  value={monthlyPriceBrl}
                  onChange={(e) => setMonthlyPriceBrl(e.target.value)}
                  placeholder="R$/mês"
                  className="border-b border-neutral-400 bg-transparent px-1 py-1 text-[14px] focus:border-[#008A05] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full cursor-pointer rounded-[2px] bg-[#008A05] py-2 text-[13px] font-medium uppercase tracking-wide text-white shadow-sm hover:bg-[#007304] disabled:opacity-60"
              >
                {busy ? 'Salvando...' : 'Cadastrar Usuário'}
              </button>
            </form>

            <div className="space-y-2.5">
              {subscriptions.map((sub) => {
                const state = getSubscriptionState(sub, nowMs);
                return (
                  <div
                    key={sub.id}
                    className="rounded border border-neutral-300 bg-white p-3 text-[13px] shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[15px] font-bold">{sub.username}</p>
                        <p className="break-all text-neutral-600">{sub.userEmail}</p>
                      </div>
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                          state.effectiveStatus === 'active'
                            ? 'bg-green-100 text-[#008A05]'
                            : 'bg-red-100 text-[#CC0000]'
                        }`}
                      >
                        {state.effectiveStatus === 'active'
                          ? 'Ativo'
                          : state.effectiveStatus === 'expired'
                            ? 'Vencido'
                            : 'Bloqueado'}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-1 text-[12px] text-neutral-700">
                      <span>Plano: {sub.planName}</span>
                      <span>
                        Mensal: <strong>{formatBrl(sub.monthlyPriceBrl)}/mês</strong>
                      </span>
                      <span>
                        Restante: <strong>{state.remainingDays}</strong> / {sub.daysOfUse} dias
                      </span>
                      <span>
                        Vence:{' '}
                        {sub.expiresAt
                          ? sub.expiresAt.toDate().toLocaleDateString('pt-BR')
                          : '-'}
                      </span>
                    </div>

                    {editingPassSubId === sub.id && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="password"
                          value={resetPassValue}
                          onChange={(e) => setResetPassValue(e.target.value)}
                          placeholder="Nova senha"
                          className="flex-1 border-b border-neutral-400 px-1 py-1 text-[13px] focus:border-[#008A05] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (resetPassValue.length < 4) {
                              setError('Senha mínima de 4 caracteres.');
                              return;
                            }
                            await onResetSubscriptionPassword(sub, resetPassValue);
                            setEditingPassSubId(null);
                            setResetPassValue('');
                            setFeedback('Senha atualizada.');
                          }}
                          className="cursor-pointer rounded bg-[#008A05] px-2.5 py-1 text-[12px] text-white"
                        >
                          Salvar
                        </button>
                      </div>
                    )}

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => onRenewSubscription(sub, sub.daysOfUse || 30)}
                        className="cursor-pointer rounded bg-[#008A05] px-2.5 py-1 text-[11px] font-medium uppercase text-white hover:bg-[#007304]"
                      >
                        Renovar (+{sub.daysOfUse || 30}d)
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleBlockSubscription(sub)}
                        className="cursor-pointer rounded bg-[#D6D7D7] px-2.5 py-1 text-[11px] font-medium uppercase text-[#212121] hover:bg-[#C8C9C9]"
                      >
                        {state.isBlocked ? 'Desbloquear' : 'Bloquear'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPassSubId(editingPassSubId === sub.id ? null : sub.id);
                          setResetPassValue('');
                        }}
                        className="cursor-pointer rounded bg-[#D6D7D7] px-2.5 py-1 text-[11px] font-medium uppercase text-[#212121] hover:bg-[#C8C9C9]"
                      >
                        Senha
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSubscription(sub.id)}
                        className="cursor-pointer rounded bg-[#CC0000] px-2.5 py-1 text-[11px] font-medium uppercase text-white hover:bg-[#A60000]"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}

              {subscriptions.length === 0 && (
                <p className="py-4 text-center text-[13px] text-neutral-500">
                  Nenhum usuário cadastrado ainda.
                </p>
              )}
            </div>
          </>
        )}

        {tab === 'plans' && (
          <>
            <form
              onSubmit={handleAddPlan}
              className="space-y-2.5 rounded border border-neutral-300 bg-white p-3 shadow-sm"
            >
              <p className="text-[15px] font-bold text-[#008A05]">
                Criar Plano (Dias de Uso + R$/mês)
              </p>
              <input
                type="text"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="Nome do plano (ex: Mensal)"
                className="w-full border-b border-neutral-400 bg-transparent px-1 py-1 text-[14px] focus:border-[#008A05] focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={newPlanDays}
                  onChange={(e) => setNewPlanDays(e.target.value)}
                  placeholder="Dias de uso"
                  className="border-b border-neutral-400 bg-transparent px-1 py-1 text-[14px] focus:border-[#008A05] focus:outline-none"
                />
                <input
                  type="text"
                  value={newPlanMonthly}
                  onChange={(e) => setNewPlanMonthly(e.target.value)}
                  placeholder="Valor R$/mês"
                  className="border-b border-neutral-400 bg-transparent px-1 py-1 text-[14px] focus:border-[#008A05] focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 cursor-pointer rounded-[2px] bg-[#008A05] py-2 text-[13px] font-medium uppercase tracking-wide text-white shadow-sm hover:bg-[#007304]"
                >
                  Adicionar Plano
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onSeedDefaultPlans}
                  className="cursor-pointer rounded-[2px] bg-[#D6D7D7] px-3 py-2 text-[12px] font-medium uppercase text-[#212121] hover:bg-[#C8C9C9]"
                >
                  Padrão R$
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded border border-neutral-300 bg-white p-3 text-[13px] shadow-sm"
                >
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-neutral-600">
                      {p.daysOfUse} dias •{' '}
                      <strong className="text-[#008A05]">
                        {formatBrl(p.monthlyPriceBrl)}/mês
                      </strong>{' '}
                      (Total: {formatBrl(p.totalPriceBrl)})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeletePlan(p.id)}
                    className="cursor-pointer rounded bg-[#CC0000] px-2.5 py-1 text-[11px] font-medium uppercase text-white"
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
