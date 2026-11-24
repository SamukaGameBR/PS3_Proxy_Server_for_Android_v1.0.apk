import React, { useState } from 'react';
import {
  BLUEPRINT_LIMITS,
  formatBrl,
  getSubscriptionState,
  UserSubscription,
} from '../types';
import { STRINGS } from '../strings';
import { Toolbar } from '../components/Toolbar';

interface AccountScreenProps {
  userEmail: string;
  isAdmin: boolean;
  subscription: UserSubscription | null;
  nowMs: number;
  onUpdateCredentials: (username: string, newPassword: string) => Promise<void>;
  onSignOut: () => void;
  onBack: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  userEmail,
  isAdmin,
  subscription,
  nowMs,
  onUpdateCredentials,
  onSignOut,
  onBack,
}) => {
  const [username, setUsername] = useState(subscription?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const subState = getSubscriptionState(subscription, nowMs);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const trimmed = username.trim();
    if (
      trimmed.length < BLUEPRINT_LIMITS.usernameMin ||
      trimmed.length > BLUEPRINT_LIMITS.usernameMax ||
      !BLUEPRINT_LIMITS.usernamePattern.test(trimmed)
    ) {
      setError('Usuário deve ter 3 a 40 caracteres (letras, números, _, . ou -).');
      return;
    }
    if (newPassword.length < 4 || newPassword.length > 64) {
      setError('A nova senha deve ter entre 4 e 64 caracteres.');
      return;
    }
    setSaving(true);
    try {
      await onUpdateCredentials(trimmed, newPassword);
      setNewPassword('');
      setMessage('Usuário e senha atualizados com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-[#FAFAFA]">
      <Toolbar title={STRINGS.appName} showBack onBack={onBack} />

      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-[#212121]">
        <h2 className="text-[24px] text-[#008A05]">Minha Conta e Assinatura</h2>

        <div className="space-y-2 rounded border border-neutral-300 bg-white p-4 text-[14px] shadow-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600">E-mail Google:</span>
            <strong className="break-all">{userEmail}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Perfil:</span>
            <strong>{isAdmin ? 'Administrador' : 'Usuário'}</strong>
          </div>

          {subscription && (
            <>
              <div className="flex justify-between">
                <span className="text-neutral-600">Usuário de acesso:</span>
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
                <span className="text-neutral-600">Dias restantes:</span>
                <strong className={subState.remainingDays <= 3 ? 'text-[#CC0000]' : 'text-[#008A05]'}>
                  {subState.remainingDays} dia(s)
                </strong>
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
                <strong>
                  {subscription.expiresAt
                    ? subscription.expiresAt.toDate().toLocaleString('pt-BR')
                    : '-'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Status:</span>
                <strong
                  className={
                    subState.effectiveStatus === 'active'
                      ? 'text-[#008A05]'
                      : 'text-[#CC0000]'
                  }
                >
                  {subState.effectiveStatus === 'active'
                    ? 'ATIVO'
                    : subState.effectiveStatus === 'expired'
                      ? 'VENCIDO'
                      : 'BLOQUEADO'}
                </strong>
              </div>
            </>
          )}
        </div>

        {subscription && subState.effectiveStatus === 'active' && (
          <form
            onSubmit={handleSave}
            className="space-y-3 rounded border border-neutral-300 bg-white p-4 shadow-sm"
          >
            <p className="text-[15px] font-medium">Alterar Usuário e Senha</p>
            <div>
              <label htmlFor="acc-username" className="block text-[13px] text-neutral-600">
                Usuário
              </label>
              <input
                id="acc-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full border-b border-neutral-400 bg-transparent px-1 py-1 text-[15px] focus:border-[#008A05] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="acc-password" className="block text-[13px] text-neutral-600">
                Nova Senha
              </label>
              <input
                id="acc-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
                className="mt-1 w-full border-b border-neutral-400 bg-transparent px-1 py-1 text-[15px] focus:border-[#008A05] focus:outline-none"
              />
            </div>

            {error && <p className="text-[13px] text-[#CC0000]">{error}</p>}
            {message && <p className="text-[13px] text-[#008A05]">{message}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full cursor-pointer rounded-[2px] bg-[#008A05] py-2 text-[14px] font-medium uppercase tracking-wide text-white shadow-sm hover:bg-[#007304] disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar credenciais'}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={onSignOut}
          className="w-full cursor-pointer rounded-[2px] bg-[#B80000] py-2.5 text-[14px] font-medium uppercase tracking-wide text-white shadow-sm hover:bg-[#9E0000]"
        >
          Sair (Logout)
        </button>
      </div>
    </div>
  );
};
