import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        title="Instalar aplicativo"
        aria-label="Instalar aplicativo"
        className="mr-1 flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[2px] border border-white/40 bg-white/15 px-2.5 py-1 text-[12px] font-medium uppercase tracking-wide text-white hover:bg-white/25 active:bg-white/35"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Instalar
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="Instalar no iOS"
          className="mr-1 flex shrink-0 cursor-pointer items-center gap-1 rounded-[2px] border border-white/40 bg-white/15 px-2.5 py-1 text-[12px] font-medium uppercase tracking-wide text-white hover:bg-white/25"
        >
          Instalar
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 text-[#212121]">
            <div className="w-full max-w-sm rounded-[2px] bg-white p-5 shadow-xl">
              <h3 className="text-[18px] font-medium text-[#B80000]">
                Instalar no iPhone / iPad
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-700">
                1. Toque no botão <strong>Compartilhar</strong> na barra do Safari.
                <br />
                2. Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full cursor-pointer rounded-[2px] bg-[#D6D7D7] py-2 text-[13px] font-medium uppercase text-[#212121] hover:bg-[#C8C9C9]"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
