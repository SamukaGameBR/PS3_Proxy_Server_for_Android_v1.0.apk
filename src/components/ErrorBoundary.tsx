import React from 'react';
import { Toolbar } from './Toolbar';
import { STRINGS } from '../strings';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Ocorreu um erro inesperado.',
    };
  }

  render() {
    if (this.state.hasError) {
      let friendly = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message) as { error?: string; operationType?: string; path?: string };
        if (parsed.error) {
          friendly = `${parsed.error} (${parsed.operationType || 'op'} em ${parsed.path || 'firestore'})`;
        }
      } catch {
        // plain string message
      }

      return (
        <div className="flex min-h-screen w-full justify-center bg-[#ececec]">
          <div className="flex min-h-screen w-full max-w-[460px] flex-col bg-[#FAFAFA] shadow-lg sm:my-4 sm:min-h-[760px] sm:overflow-hidden sm:rounded">
            <Toolbar title={STRINGS.appName} />
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <p className="text-[20px] font-bold text-[#CC0000]">Erro de Sistema / Permissão</p>
              <p className="mt-3 break-words text-[14px] text-neutral-700">{friendly}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 cursor-pointer rounded-[2px] bg-[#D6D7D7] px-5 py-2.5 text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9]"
              >
                Recarregar aplicativo
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
