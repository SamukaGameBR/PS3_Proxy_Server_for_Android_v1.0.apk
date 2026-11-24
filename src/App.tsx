import React, { useCallback, useEffect, useState } from 'react';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  ScreenName,
  ServerStatus,
  UpdateInfo,
} from './types';
import { STRINGS } from './strings';
import { MainScreen } from './screens/MainScreen';
import { RulesScreen } from './screens/RulesScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { RealtimeLogsScreen } from './screens/RealtimeLogsScreen';
import { InstructionsScreen } from './screens/InstructionsScreen';
import { CreditsScreen } from './screens/CreditsScreen';
import { UpdateFoundScreen } from './screens/UpdateFoundScreen';

const STORAGE_KEY = 'ppsfa_app_settings';

function loadSavedSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function validatePort(portStr: string): number | null {
  if (!portStr.trim()) return null;
  const num = Number(portStr);
  if (!Number.isInteger(num) || num < 1024 || num > 65535) return null;
  return num;
}

export const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(loadSavedSettings);
  const [screen, setScreen] = useState<ScreenName>('main');
  const [ipInput, setIpInput] = useState<string>(settings.ip);
  const [portInput, setPortInput] = useState<string>(settings.autoSavePort ? settings.port : '8080');
  const [errorIp, setErrorIp] = useState('');
  const [errorPort, setErrorPort] = useState('');
  const [busy, setBusy] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [status, setStatus] = useState<ServerStatus>({
    running: false,
    ip: settings.ip,
    port: Number(settings.port) || 8080,
    sessionId: 0,
    error: '',
    logsCount: 0,
  });

  const persistSettings = useCallback((next: AppSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const buildProxyPayload = (s: AppSettings, ip: string, portNum: number) => ({
    ip,
    port: portNum,
    customPs3Updatelist: s.customPs3Updatelist,
    manualPs3Updatelist: s.manualPs3Updatelist,
    pathPs3Updatelist: s.pathPs3Updatelist,
    customRulesUrls: s.customRulesUrls,
    whatsNewPsxPlaceNews: s.whatsNewPsxPlaceNews,
    whatsNewRssFeed: s.whatsNewRssFeed,
    whatsNewRssFeedUrl: s.whatsNewRssFeedUrl,
    psStorePsxPlaceNews: s.psStorePsxPlaceNews,
    psStoreRssFeed: s.psStoreRssFeed,
    psStoreRssFeedUrl: s.psStoreRssFeedUrl,
    tvVideoServicesPsxPlaceNews: s.tvVideoServicesPsxPlaceNews,
    tvVideoServicesRssFeed: s.tvVideoServicesRssFeed,
    tvVideoServicesRssFeedUrl: s.tvVideoServicesRssFeedUrl,
    psxPlaceXmlUrl: s.psxPlaceXmlUrl,
  });

  useEffect(() => {
    let active = true;

    async function init() {
      const [ipRes, statusRes] = await Promise.all([
        fetch('/api/ip').catch(() => null),
        fetch('/api/status').catch(() => null),
      ]);

      let detectedIp = 'localhost';
      if (ipRes && ipRes.ok) {
        const ipData = (await ipRes.json()) as { ip: string };
        detectedIp = ipData.ip || 'localhost';
      }

      if (active) {
        setSettings((prev) => {
          const initialIp = prev.autoSaveIp ? prev.ip : detectedIp;
          const initialPort = prev.autoSavePort ? prev.port : '8080';
          setIpInput(initialIp);
          setPortInput(initialPort);
          const next = { ...prev, ip: initialIp, port: initialPort };
          persistSettings(next);
          return next;
        });
      }

      if (statusRes && statusRes.ok && active) {
        const sData = (await statusRes.json()) as ServerStatus;
        setStatus(sData);
      }

      if (!settings.disableAutoUpdater) {
        const today = String(new Date().getDate()).padStart(2, '0');
        if (today !== settings.ignoreUpdateDay) {
          try {
            const updRes = await fetch('/api/check-updates');
            if (updRes.ok && active) {
              const updData = (await updRes.json()) as UpdateInfo;
              if (updData.psxPlaceXmlUrl) {
                setSettings((prev) => {
                  const next = { ...prev, psxPlaceXmlUrl: updData.psxPlaceXmlUrl };
                  persistSettings(next);
                  return next;
                });
              }
              if (updData.updateFound) {
                setUpdateInfo(updData);
                setScreen('update_found');
              }
            }
          } catch {
            // ignore update check failure on startup
          }
        }
      }
    }

    init();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateSettings = async (
    patch: Partial<AppSettings>,
    restartIfRunning = false
  ) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    persistSettings(next);

    if (restartIfRunning && status.running) {
      const validPort = validatePort(portInput) ?? status.port;
      setBusy(true);
      try {
        const res = await fetch('/api/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildProxyPayload(next, ipInput.trim() || status.ip, validPort)),
        });
        const data = (await res.json()) as {
          ok: boolean;
          error?: string;
          status: ServerStatus;
        };
        if (data.status) setStatus(data.status);
        if (!data.ok && data.error) {
          setErrorIp(`${STRINGS.errorIp} (${ipInput})`);
        }
      } finally {
        setBusy(false);
      }
    }
  };

  const handleToggleServer = async () => {
    setErrorIp('');
    if (status.running) {
      setBusy(true);
      try {
        const res = await fetch('/api/stop', { method: 'POST' });
        const data = (await res.json()) as { status: ServerStatus };
        if (data.status) setStatus(data.status);
      } finally {
        setBusy(false);
      }
      return;
    }

    const validPort = validatePort(portInput);
    if (validPort === null) {
      setErrorPort(STRINGS.invalidPort);
      return;
    }
    setErrorPort('');

    const targetIp = ipInput.trim() || 'localhost';
    const nextSettings = { ...settings, ip: targetIp, port: String(validPort) };
    setSettings(nextSettings);
    persistSettings(nextSettings);

    setBusy(true);
    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildProxyPayload(nextSettings, targetIp, validPort)),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        status: ServerStatus;
      };
      if (data.status) setStatus(data.status);
      if (!data.ok) {
        setErrorIp(`${STRINGS.errorIp} (${targetIp})`);
      }
    } catch {
      setErrorIp(`${STRINGS.errorIp} (${targetIp})`);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateIp = async () => {
    setErrorIp('');
    try {
      const res = await fetch('/api/ip');
      const data = (await res.json()) as { ip: string };
      const detectedIp = data.ip || 'localhost';
      setIpInput(detectedIp);

      if (detectedIp !== settings.ip && status.running) {
        const validPort = validatePort(portInput) ?? status.port;
        const nextSettings = { ...settings, ip: detectedIp, port: String(validPort) };
        setSettings(nextSettings);
        persistSettings(nextSettings);

        setBusy(true);
        const restartRes = await fetch('/api/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildProxyPayload(nextSettings, detectedIp, validPort)),
        });
        const restartData = (await restartRes.json()) as {
          ok: boolean;
          status: ServerStatus;
        };
        if (restartData.status) setStatus(restartData.status);
        if (!restartData.ok) {
          setErrorIp(`${STRINGS.errorIp} (${detectedIp})`);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleUpdatePort = async () => {
    if (!status.running) return;
    const validPort = validatePort(portInput);
    if (validPort === null) {
      setErrorPort(STRINGS.invalidPort);
      return;
    }
    setErrorPort('');

    if (String(validPort) === String(status.port)) return;

    const targetIp = ipInput.trim() || status.ip;
    const nextSettings = { ...settings, ip: targetIp, port: String(validPort) };
    setSettings(nextSettings);
    persistSettings(nextSettings);

    setBusy(true);
    try {
      const res = await fetch('/api/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildProxyPayload(nextSettings, targetIp, validPort)),
      });
      const data = (await res.json()) as { ok: boolean; status: ServerStatus };
      if (data.status) setStatus(data.status);
      if (!data.ok) {
        setErrorIp(`${STRINGS.errorIp} (${targetIp})`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleIgnoreDay = () => {
    const today = String(new Date().getDate()).padStart(2, '0');
    handleUpdateSettings({ ignoreUpdateDay: today });
    setScreen('main');
  };

  return (
    <div className="flex min-h-screen w-full justify-center bg-[#ececec]">
      <main className="flex min-h-screen w-full max-w-[460px] flex-col bg-[#FAFAFA] shadow-lg sm:my-4 sm:min-h-[760px] sm:overflow-hidden sm:rounded">
        {screen === 'main' && (
          <MainScreen
            status={status}
            ipInput={ipInput}
            portInput={portInput}
            errorIp={errorIp}
            errorPort={errorPort}
            busy={busy}
            onIpInputChange={setIpInput}
            onPortInputChange={setPortInput}
            onUpdateIp={handleUpdateIp}
            onUpdatePort={handleUpdatePort}
            onToggleServer={handleToggleServer}
            onNavigate={setScreen}
          />
        )}

        {screen === 'rules' && (
          <RulesScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onBack={() => setScreen('main')}
          />
        )}

        {screen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={(patch) => handleUpdateSettings(patch, false)}
            onUpdateFound={(info) => {
              setUpdateInfo(info);
              setScreen('update_found');
            }}
            onBack={() => setScreen('main')}
          />
        )}

        {screen === 'logs' && (
          <RealtimeLogsScreen
            seeRequests={settings.seeRequests}
            onBack={() => setScreen('main')}
          />
        )}

        {screen === 'instructions' && (
          <InstructionsScreen onBack={() => setScreen('main')} />
        )}

        {screen === 'credits' && <CreditsScreen onBack={() => setScreen('main')} />}

        {screen === 'update_found' && updateInfo && (
          <UpdateFoundScreen
            updateInfo={updateInfo}
            onIgnoreDay={handleIgnoreDay}
            onBack={() => setScreen('main')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
