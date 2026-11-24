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
import { hashPassword } from '../firebase';

interface AccessGateScreenProps {
  userEmail: string;
  subscription: UserSubscription | null;
  plans: SubscriptionPlan[];
  nowMs: number;
  onCreateTrial: (username: string, password: string) => Promise<void>;
  onUnlockSuccess: () => void;
  onSignOut: () => void;
}

export const AccessGateScreen: React.FC<AccessGateScreenProps> = ({
  userEmail,
  subscription,
  plans,
  nowMs,
  onCreateTrial,
  onUnlockSuccess,
  onSignOut,
}) => {
  const [username, setUsername] = useState(subscription?.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const subState = getSubscriptionState(subscription, nowMs);

  const handleRegisterTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedUser = username.trim();

    if (
      trimmedUser.length < BLUEPRINT_LIMITS.usernameMin ||
      trimmedUser.length > BLUEPRINT_LIMITS.usernameMax ||
      !BLUEPRINT_LIMITS.usernamePattern.test(trimmedUser)
    ) {
      setError('Usuário deve ter entre 3 e 40 caracteres (letras, números, _, . ou -).');
      return;
    }
    if (password.length < 4 || password.length > 64) {
      setError('A senha deve ter entre 4 e 64 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setBusy(true);
    try {
      await onCreateTrial(trimmedUser, password);
      onUnlockSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar credencial.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription) return;
    setError('');

    const trimmedUser = username.trim();
    if (trimmedUser.toLowerCase() !== subscription.username.toLowerCase()) {
      setError('Usuário incorreto.');
      return;
    }
    if (!password) {
      setError('Informe a senha.');
      return;
    }

    setBusy(true);
    try {
      const computedHash = await hashPassword(password, subscription.passwordSalt);
      if (computedHash !== subscription.passwordHash) {
        setError('Senha incorreta.');
        return;
      }
      onUnlockSuccess();
    } finally {
      setBusy(false);
    }
  };

  // Case 1: No subscription yet -> Register username/password + 3-day trial
  if (!subscription) {
    return (
      <div className="flex min-h-full flex-col bg-[#FAFAFA]">
        <Toolbar title={STRINGS.appName} />

        <div className="flex-1 overflow-y-auto p-4 text-[#212121]">
          <h2 className="text-[22px] font-medium text-[#008A05]">
            Cadastrar Usuário e Senha
          </h2>
          <p className="mt-1 text-[13px] text-neutral-600">
            Conta Google: <strong>{userEmail}</strong>
          </p>
          <p className="mt-2 text-[14px] text-neutral-700">
            Crie seu usuário e senha de acesso para iniciar o período de teste gratuito de <strong>3 dias</strong> ou aguarde a liberação de um plano mensal pelo administrador.
          </p>

          <form onSubmit={handleRegisterTrial} className="mt-4 space-y-3 rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <div>
              <label htmlFor="trial-username" className="block text-[14px] font-medium">
                Usuário
              </label>
              <input
                id="trial-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: joao_ps3"
                className="mt-1 w-full border-b border-neutral-400 bg-transparent px-1 py-1.5 text-[15px] focus:border-[#008A05] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="trial-password" className="block text-[14px] font-medium">
                Senha
              </label>
              <input
                id="trial-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="mt-1 w-full border-b border-neutral-400 bg-transparent px-1 py-1.5 text-[15px] focus:border-[#008A05] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="trial-confirm" className="block text-[14px] font-medium">
                Confirmar senha
              </label>
              <input
                id="trial-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="mt-1 w-full border-b border-neutral-400 bg-transparent px-1 py-1.5 text-[15px] focus:border-[#008A05] focus:outline-none"
              />
            </div>

            {error && <p className="text-[13px] text-[#CC0000]">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full cursor-pointer rounded-[2px] bg-[#008A05] py-2.5 text-[14px] font-medium uppercase tracking-wide text-white shadow-sm hover:bg-[#007304] disabled:opacity-60"
            >
              {busy ? 'Ativando...' : 'Criar acesso e iniciar teste (3 dias)'}
            </button>
          </form>

          {plans.length > 0 && (
            <div className="mt-4 rounded border border-neutral-300 bg-white p-4 shadow-sm">
              <p className="text-[14px] font-bold text-[#212121]">Planos disponíveis (R$)</p>
              <div className="mt-2 space-y-2">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border-b border-neutral-200 pb-1.5 text-[13px] last:border-none"
                  >
                    <span>
                      <strong>{p.name}</strong> ({p.daysOfUse} dias)
                    </span>
                    <span className="font-bold text-[#008A05]">
                      {formatBrl(p.monthlyPriceBrl)}/mês
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onSignOut}
            className="mt-4 w-full cursor-pointer rounded-[2px] bg-[#D6D7D7] py-2.5 text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9]"
          >
            Sair da conta Google
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Expired or Blocked -> Automatic Lock Screen
  if (subState.isBlocked || subState.isExpired) {
    const expiresDateStr = subscription.expiresAt
      ? subscription.expiresAt.toDate().toLocaleString('pt-BR')
      : '-';

    return (
      <div className="flex min-h-full flex-col bg-[#FAFAFA]">
        <Toolbar title={STRINGS.appName} />

        <div className="flex flex-1 flex-col justify-center p-5 text-[#212121]">
          <div className="rounded border-2 border-[#CC0000] bg-white p-5 shadow-md">
            <p className="text-center text-[13px] font-bold uppercase tracking-wider text-[#CC0000]">
              Bloqueio Automático por Vencimento
            </p>
            <h2 className="mt-1 text-center text-[22px] font-bold text-[#212121]">
              {subState.isBlocked ? 'Acesso Bloqueado' : 'Assinatura Vencida'}
            </h2>
            <p className="mt-2 text-center text-[14px] text-neutral-600">
              {subState.isBlocked
                ? 'Seu acesso ao servidor proxy foi bloqueado pelo administrador.'
                : 'O prazo de dias de uso da sua assinatura terminou e o proxy foi bloqueado automaticamente.'}
            </p>

            <div className="mt-4 space-y-2 border-t border-neutral-200 pt-3 text-[14px]">
              <div className="flex justify-between">
                <span className="text-neutral-600">Usuário:</span>
                <strong>{subscription.username}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Plano:</span>
                <strong>{subscription.planName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Dias contratados:</span>
                <strong>{subscription.daysOfUse} dias</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Valor mensal:</span>
                <strong className="text-[#008A05]">
                  {formatBrl(subscription.monthlyPriceBrl)} / mês
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Valor total:</span>
                <strong>{formatBrl(subscription.totalPriceBrl)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Vencimento:</span>
                <strong className="text-[#CC0000]">{expiresDateStr}</strong>
              </div>
            </div>

            <p className="mt-4 rounded bg-neutral-100 p-3 text-center text-[13px] text-neutral-700">
              Solicite a renovação de dias ao administrador para desbloquear o aplicativo.
            </p>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="mt-5 w-full cursor-pointer rounded-[2px] bg-[#D6D7D7] py-2.5 text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9]"
          >
            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Active subscription -> Authenticate with Usuário & Senha
  return (
    <div className="flex min-h-full flex-col bg-[#FAFAFA]">
      <Toolbar title={STRINGS.appName} />

      <div className="flex flex-1 flex-col justify-center p-5 text-[#212121]">
        <div className="rounded border border-neutral-300 bg-white p-5 shadow-sm">
          <h2 className="text-[20px] font-medium text-[#212121]">
            Login do Aplicativo
          </h2>
          <p className="mt-1 text-[13px] text-neutral-600">
            Plano: <strong>{subscription.planName}</strong> •{' '}
            <span className="font-semibold text-[#008A05]">
              {subState.remainingDays} dia(s) restante(s)
            </span>{' '}
            ({formatBrl(subscription.monthlyPriceBrl)}/mês)
          </p>

          <form onSubmit={handleVerifyCredentials} className="mt-4 space-y-3">
            <div>
              <label htmlFor="login-username" className="block text-[14px] font-medium">
                Usuário
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                className="mt-1 w-full border-b border-neutral-400 bg-transparent px-1 py-1.5 text-[15px] focus:border-[#008A05] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-[14px] font-medium">
                Senha
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="mt-1 w-full border-b border-neutral-400 bg-transparent px-1 py-1.5 text-[15px] focus:border-[#008A05] focus:outline-none"
              />
            </div>

            {error && <p className="text-[13px] text-[#CC0000]">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full cursor-pointer rounded-[2px] bg-[#008A05] py-2.5 text-[14px] font-medium uppercase tracking-wide text-white shadow-sm hover:bg-[#007304] disabled:opacity-60"
            >
              {busy ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 w-full cursor-pointer rounded-[2px] bg-[#D6D7D7] py-2.5 text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9]"
        >
          Trocar conta Google
        </button>
      </div>
    </div>
  );
};
