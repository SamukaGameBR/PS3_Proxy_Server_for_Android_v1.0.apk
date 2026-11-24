import React, { useRef, useState } from 'react';
import { AppSettings } from '../types';
import { STRINGS } from '../strings';
import { Toolbar } from '../components/Toolbar';
import { AndroidSwitch } from '../components/AndroidSwitch';

interface RulesScreenProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>, restartIfRunning?: boolean) => void;
  onBack: () => void;
}

export const RulesScreen: React.FC<RulesScreenProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  const updatelistFileInputRef = useRef<HTMLInputElement>(null);
  const customRuleFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploadError('');
    try {
      const arrayBuf = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const contentBase64 = btoa(binary);
      const res = await fetch('/api/upload-rule-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentBase64 }),
      });
      if (!res.ok) {
        throw new Error('Failed to upload file');
      }
      const data = (await res.json()) as { path: string };
      return data.path;
    } catch {
      setUploadError('Failed to load selected file.');
      return null;
    }
  };

  const handleUpdatelistFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const savedPath = await uploadFile(file);
    if (savedPath) {
      onUpdateSettings({ pathPs3Updatelist: savedPath }, true);
    }
    e.target.value = '';
  };

  const handleCustomRuleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const savedPath = await uploadFile(file);
    if (savedPath) {
      const current = settings.customRulesUrls;
      onUpdateSettings({ customRulesUrls: `${current} --> ${savedPath}` }, true);
    }
    e.target.value = '';
  };

  const officialChecked = !settings.customPs3Updatelist;

  return (
    <div className="flex min-h-full flex-col bg-[#FAFAFA]">
      <Toolbar title={STRINGS.appName} showBack onBack={onBack} />

      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-[#212121]">
        {/* Official ps3-updatelist.txt */}
        <div>
          <p className="text-[18px]">{STRINGS.officialPs3Updatelist}</p>
          <AndroidSwitch
            checked={officialChecked}
            ariaLabel={STRINGS.officialPs3Updatelist}
            onChange={(checked) =>
              onUpdateSettings({ customPs3Updatelist: !checked }, true)
            }
          />
        </div>

        {/* Manual ps3-updatelist.txt */}
        <div>
          <p className="text-[18px]">{STRINGS.autoGenerateFile}</p>
          <AndroidSwitch
            checked={settings.manualPs3Updatelist}
            disabled={officialChecked}
            ariaLabel={STRINGS.autoGenerateFile}
            onChange={(checked) =>
              onUpdateSettings(
                {
                  manualPs3Updatelist: checked,
                  pathPs3Updatelist: checked ? settings.pathPs3Updatelist : 'NONE',
                },
                true
              )
            }
          />
        </div>

        <div>
          <input
            ref={updatelistFileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpdatelistFileSelected}
          />
          <button
            type="button"
            onClick={() => updatelistFileInputRef.current?.click()}
            className="cursor-pointer rounded-[2px] bg-[#D6D7D7] px-4 py-2 text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9]"
          >
            {STRINGS.chooseFile}
          </button>
          <p className="mt-2 break-all text-[18px] text-[#008A05]">
            {STRINGS.chosenFile}
            {settings.pathPs3Updatelist}
          </p>
        </div>

        {/* Custom URL redirection rules */}
        <div className="pt-2">
          <p className="text-[18px] leading-snug">{STRINGS.customRules}</p>
          <textarea
            rows={4}
            value={settings.customRulesUrls}
            onChange={(e) => onUpdateSettings({ customRulesUrls: e.target.value }, true)}
            placeholder={STRINGS.customRedirectionRules}
            className="mt-2 w-full border-b border-neutral-400 bg-transparent p-1.5 text-[16px] text-[#212121] focus:border-[#008A05] focus:outline-none"
          />
          <input
            ref={customRuleFileInputRef}
            type="file"
            className="hidden"
            onChange={handleCustomRuleFileSelected}
          />
          <button
            type="button"
            onClick={() => customRuleFileInputRef.current?.click()}
            className="mt-2 cursor-pointer rounded-[2px] bg-[#D6D7D7] px-4 py-2 text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9]"
          >
            {STRINGS.chooseFile}
          </button>
        </div>

        {uploadError && <p className="text-[14px] text-[#CC0000]">{uploadError}</p>}

        {/* What's New */}
        <div className="pt-2">
          <p className="text-[18px]">{STRINGS.whatsNewPsxPlaceNews}</p>
          <AndroidSwitch
            checked={settings.whatsNewPsxPlaceNews}
            ariaLabel={STRINGS.whatsNewPsxPlaceNews}
            onChange={(checked) =>
              onUpdateSettings(
                {
                  whatsNewPsxPlaceNews: checked,
                  whatsNewRssFeed: checked ? false : settings.whatsNewRssFeed,
                },
                true
              )
            }
          />

          <p className="text-[18px]">{STRINGS.whatsNewRssFeed}</p>
          <AndroidSwitch
            checked={settings.whatsNewRssFeed}
            ariaLabel={STRINGS.whatsNewRssFeed}
            onChange={(checked) =>
              onUpdateSettings(
                {
                  whatsNewRssFeed: checked,
                  whatsNewPsxPlaceNews: checked ? false : settings.whatsNewPsxPlaceNews,
                },
                true
              )
            }
          />

          <input
            type="url"
            value={settings.whatsNewRssFeedUrl}
            onChange={(e) => onUpdateSettings({ whatsNewRssFeedUrl: e.target.value }, true)}
            placeholder={STRINGS.whatsNewRssFeedUrl}
            className="mt-1 w-full border-b border-neutral-400 bg-transparent px-1 py-1.5 text-[16px] text-[#212121] focus:border-[#008A05] focus:outline-none"
          />
        </div>

        {/* PS Store */}
        <div className="pt-2">
          <p className="text-[18px]">{STRINGS.psStorePsxPlaceNews}</p>
          <AndroidSwitch
            checked={settings.psStorePsxPlaceNews}
            ariaLabel={STRINGS.psStorePsxPlaceNews}
            onChange={(checked) =>
              onUpdateSettings(
                {
                  psStorePsxPlaceNews: checked,
                  psStoreRssFeed: checked ? false : settings.psStoreRssFeed,
                },
                true
              )
            }
          />

          <p className="text-[18px]">{STRINGS.psStoreRssFeed}</p>
          <AndroidSwitch
            checked={settings.psStoreRssFeed}
            ariaLabel={STRINGS.psStoreRssFeed}
            onChange={(checked) =>
              onUpdateSettings(
                {
                  psStoreRssFeed: checked,
                  psStorePsxPlaceNews: checked ? false : settings.psStorePsxPlaceNews,
                },
                true
              )
            }
          />

          <input
            type="url"
            value={settings.psStoreRssFeedUrl}
            onChange={(e) => onUpdateSettings({ psStoreRssFeedUrl: e.target.value }, true)}
            placeholder={STRINGS.psStoreRssFeedUrl}
            className="mt-1 w-full border-b border-neutral-400 bg-transparent px-1 py-1.5 text-[16px] text-[#212121] focus:border-[#008A05] focus:outline-none"
          />
        </div>

        {/* TV/Video Services */}
        <div className="pt-2 pb-4">
          <p className="text-[18px]">{STRINGS.tvVideoServicesPsxPlaceNews}</p>
          <AndroidSwitch
            checked={settings.tvVideoServicesPsxPlaceNews}
            ariaLabel={STRINGS.tvVideoServicesPsxPlaceNews}
            onChange={(checked) =>
              onUpdateSettings(
                {
                  tvVideoServicesPsxPlaceNews: checked,
                  tvVideoServicesRssFeed: checked
                    ? false
                    : settings.tvVideoServicesRssFeed,
                },
                true
              )
            }
          />

          <p className="text-[18px]">{STRINGS.tvVideoServicesRssFeed}</p>
          <AndroidSwitch
            checked={settings.tvVideoServicesRssFeed}
            ariaLabel={STRINGS.tvVideoServicesRssFeed}
            onChange={(checked) =>
              onUpdateSettings(
                {
                  tvVideoServicesRssFeed: checked,
                  tvVideoServicesPsxPlaceNews: checked
                    ? false
                    : settings.tvVideoServicesPsxPlaceNews,
                },
                true
              )
            }
          />

          <input
            type="url"
            value={settings.tvVideoServicesRssFeedUrl}
            onChange={(e) =>
              onUpdateSettings({ tvVideoServicesRssFeedUrl: e.target.value }, true)
            }
            placeholder={STRINGS.tvVideoServicesRssFeedUrl}
            className="mt-1 w-full border-b border-neutral-400 bg-transparent px-1 py-1.5 text-[16px] text-[#212121] focus:border-[#008A05] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
