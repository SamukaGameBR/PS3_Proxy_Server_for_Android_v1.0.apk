import React from 'react';
import { ScreenName, ServerStatus } from '../types';
import { STRINGS } from '../strings';
import { Toolbar } from '../components/Toolbar';

interface MainScreenProps {
  status: ServerStatus;
  ipInput: string;
  portInput: string;
  errorIp: string;
  errorPort: string;
  busy: boolean;
  onIpInputChange: (val: string) => void;
  onPortInputChange: (val: string) => void;
  onUpdateIp: () => void;
  onUpdatePort: () => void;
  onToggleServer: () => void;
  onNavigate: (screen: ScreenName) => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({
  status,
  ipInput,
  portInput,
  errorIp,
  errorPort,
  busy,
  onIpInputChange,
  onPortInputChange,
  onUpdateIp,
  onUpdatePort,
  onToggleServer,
  onNavigate,
}) => {
  return (
    <div className="flex min-h-full flex-col bg-[#FAFAFA]">
      <Toolbar
        title={STRINGS.appName}
        menuItems={[
          { label: STRINGS.howToUse, onClick: () => onNavigate('instructions') },
          { label: STRINGS.rules, onClick: () => onNavigate('rules') },
          { label: STRINGS.settings, onClick: () => onNavigate('settings') },
          { label: STRINGS.creditsMenu, onClick: () => onNavigate('credits') },
        ]}
      />

      <div className="relative flex flex-1 flex-col justify-between px-4 py-5">
        <div className="space-y-4">
          {/* IP Row */}
          <div>
            <div className="flex items-center gap-4">
              <label htmlFor="ip-input" className="w-12 shrink-0 text-[18px] text-[#212121]">
                IP:
              </label>
              <div className="flex flex-1 flex-col items-center">
                <input
                  id="ip-input"
                  type="text"
                  value={ipInput}
                  onChange={(e) => onIpInputChange(e.target.value)}
                  placeholder={STRINGS.enterIp}
                  className="w-full max-w-[230px] border-b border-neutral-400 bg-transparent px-1 py-1.5 text-[16px] text-[#212121] focus:border-[#008A05] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={onUpdateIp}
                  className="mt-2 w-[181px] cursor-pointer rounded-[2px] bg-[#D6D7D7] px-4 py-2 text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9] active:bg-[#BDBDBD] disabled:opacity-60"
                >
                  {STRINGS.updateIp}
                </button>
              </div>
            </div>
            {errorIp && (
              <p className="mt-2 text-center text-[14px] text-[#CC0000]">{errorIp}</p>
            )}
          </div>

          {/* Port Row */}
          <div>
            <div className="flex items-center gap-4">
              <label htmlFor="port-input" className="w-12 shrink-0 text-[18px] text-[#212121]">
                {STRINGS.port}
              </label>
              <div className="flex flex-1 flex-col items-center">
                <input
                  id="port-input"
                  type="number"
                  value={portInput}
                  onChange={(e) => onPortInputChange(e.target.value)}
                  placeholder={STRINGS.enterPort}
                  className="w-full max-w-[230px] border-b border-neutral-400 bg-transparent px-1 py-1.5 text-[16px] text-[#212121] focus:border-[#008A05] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={onUpdatePort}
                  className="mt-2 w-[181px] cursor-pointer rounded-[2px] bg-[#D6D7D7] px-4 py-2 text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9] active:bg-[#BDBDBD] disabled:opacity-60"
                >
                  {STRINGS.updatePort}
                </button>
              </div>
            </div>
            {errorPort && (
              <p className="mt-2 text-center text-[14px] text-[#CC0000]">{errorPort}</p>
            )}
          </div>
        </div>

        {/* Play/Pause + Status */}
        <div className="my-6 flex flex-col items-center">
          <button
            type="button"
            disabled={busy}
            onClick={onToggleServer}
            aria-label={status.running ? 'Stop server' : 'Start server'}
            className="flex h-[83px] w-[127px] cursor-pointer items-center justify-center rounded-[2px] bg-[#D6D7D7] p-2 shadow-sm hover:bg-[#C8C9C9] active:bg-[#BDBDBD] disabled:opacity-60"
          >
            <img
              src={status.running ? '/assets/pause.png' : '/assets/play.png'}
              alt={status.running ? 'Pause' : 'Play'}
              className="max-h-full max-w-full object-contain"
            />
          </button>

          <p className="mt-6 text-[36px] font-normal leading-tight text-[#212121]">
            {STRINGS.status}
            {status.running ? 'ON' : 'OFF'}
          </p>
          <p className="mt-3 text-[24px] text-[#212121]">
            IP: {status.running ? status.ip : 'N/A'}
          </p>
          <p className="mt-2 text-[24px] text-[#212121]">
            {STRINGS.port}
            {status.running ? status.port : 'N/A'}
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="relative flex items-center justify-center pb-1">
          <button
            type="button"
            onClick={() => onNavigate('logs')}
            className="cursor-pointer rounded-[2px] bg-[#D6D7D7] px-5 py-2.5 text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9] active:bg-[#BDBDBD]"
          >
            {STRINGS.realtimeLogs}
          </button>
          <span className="absolute bottom-0 right-0 text-[14px] text-neutral-600">v2.3</span>
        </div>
      </div>
    </div>
  );
};
