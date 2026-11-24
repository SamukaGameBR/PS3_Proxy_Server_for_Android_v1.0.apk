import React, { useState } from 'react';
import { AppSettings, UpdateInfo } from '../types';
import { STRINGS } from '../strings';
import { Toolbar } from '../components/Toolbar';
import { AndroidSwitch } from '../components/AndroidSwitch';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onUpdateFound: (info: UpdateInfo) => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onUpdateFound,
  onBack,
}) => {
  const [updateStatusMsg, setUpdateStatusMsg] = useState('');
  const [checking, setChecking] = useState(false);

  const handleManualUpdateCheck = async () => {
    setChecking(true);
    setUpdateStatusMsg('');
    try {
      const res = await fetch('/api/check-updates');
      if (!res.ok) {
        throw new Error('Failed');
      }
      const data = (await res.json()) as UpdateInfo;
      if (data.psxPlaceXmlUrl) {
        onUpdateSettings({ psxPlaceXmlUrl: data.psxPlaceXmlUrl });
      }
      if (data.updateFound) {
        onUpdateFound(data);
      } else {
        setUpdateStatusMsg(STRINGS.updateNotFound);
      }
    } catch {
      setUpdateStatusMsg(STRINGS.updateNotFoundError);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-[#FAFAFA]">
      <Toolbar title={STRINGS.appName} showBack onBack={onBack} />

      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-[#212121]">
        <div>
          <p className="text-[18px]">{STRINGS.autoStart}</p>
          <AndroidSwitch
            checked={settings.autoStartBoot}
            ariaLabel={STRINGS.autoStart}
            onChange={(checked) => onUpdateSettings({ autoStartBoot: checked })}
          />
        </div>

        <div>
          <p className="text-[18px]">{STRINGS.autoSavePort}</p>
          <AndroidSwitch
            checked={settings.autoSavePort}
            ariaLabel={STRINGS.autoSavePort}
            onChange={(checked) => onUpdateSettings({ autoSavePort: checked })}
          />
        </div>

        <div>
          <p className="text-[18px]">{STRINGS.autoSaveIp}</p>
          <AndroidSwitch
            checked={settings.autoSaveIp}
            ariaLabel={STRINGS.autoSaveIp}
            onChange={(checked) => onUpdateSettings({ autoSaveIp: checked })}
          />
        </div>

        <div>
          <p className="text-[18px]">{STRINGS.seeRequests}</p>
          <AndroidSwitch
            checked={settings.seeRequests}
            ariaLabel={STRINGS.seeRequests}
            onChange={(checked) => onUpdateSettings({ seeRequests: checked })}
          />
        </div>

        <div>
          <p className="text-[18px]">{STRINGS.disableAutoUpdater}</p>
          <AndroidSwitch
            checked={settings.disableAutoUpdater}
            ariaLabel={STRINGS.disableAutoUpdater}
            onChange={(checked) => onUpdateSettings({ disableAutoUpdater: checked })}
          />
        </div>

        <button
          type="button"
          disabled={checking}
          onClick={handleManualUpdateCheck}
          className="mt-2 w-full cursor-pointer rounded-[2px] bg-[#D6D7D7] px-4 py-2.5 text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9] active:bg-[#BDBDBD] disabled:opacity-60"
        >
          {STRINGS.checkUpdatesManually}
        </button>

        {updateStatusMsg && (
          <p className="pt-2 text-[18px] text-[#FF8800]">{updateStatusMsg}</p>
        )}
      </div>
    </div>
  );
};
