import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { STRINGS } from '../strings';
import { Toolbar } from '../components/Toolbar';

export const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao autenticar com o Google.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-[#FAFAFA]">
      <Toolbar title={STRINGS.appName} />

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center text-[#212121]">
        <img
          src="/assets/main_old_icon_without_borders.png"
          alt="Servidor Proxy PS3"
          className="h-20 w-20 object-contain"
        />
        <h2 className="mt-4 text-[22px] font-medium text-[#212121]">
          Acesso de Usuário e Assinatura
        </h2>
        <p className="mt-2 max-w-[340px] text-[14px] text-neutral-600">
          Faça login com sua conta Google para vincular seu usuário, senha, dias de uso e plano mensal em Reais (R$).
        </p>

        <div className="mt-6 w-full max-w-[340px] rounded border border-neutral-300 bg-white p-4 text-left shadow-sm">
          <p className="text-[13px] font-bold uppercase tracking-wide text-[#008A05]">
            Planos e Controle de Vencimento
          </p>
          <ul className="mt-2 space-y-1.5 text-[13px] text-neutral-700">
            <li>• Teste inicial: 3 dias gratuitos</li>
            <li>• Mensal (30 dias): R$ 29,90 / mês</li>
            <li>• Trimestral (90 dias): R$ 24,90 / mês</li>
            <li>• Anual (365 dias): R$ 19,90 / mês</li>
          </ul>
          <p className="mt-2 text-[12px] text-neutral-500">
            O servidor proxy é bloqueado automaticamente após o vencimento dos dias contratados.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="mt-6 flex w-full max-w-[340px] cursor-pointer items-center justify-center gap-3 rounded-[2px] bg-[#B80000] px-5 py-3 text-[15px] font-medium text-white shadow hover:bg-[#9E0000] active:bg-[#720000] disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" />
          </svg>
          {loading ? 'Conectando...' : 'Entrar com Google'}
        </button>

        {error && <p className="mt-3 max-w-[340px] text-[13px] text-[#CC0000]">{error}</p>}
      </div>
    </div>
  );
};
