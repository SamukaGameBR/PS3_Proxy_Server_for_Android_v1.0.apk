import React from 'react';
import { UpdateInfo } from '../types';
import { STRINGS } from '../strings';
import { Toolbar } from '../components/Toolbar';

interface UpdateFoundScreenProps {
  updateInfo: UpdateInfo;
  onIgnoreDay: () => void;
  onBack: () => void;
}

export const UpdateFoundScreen: React.FC<UpdateFoundScreenProps> = ({
  updateInfo,
  onIgnoreDay,
  onBack,
}) => {
  const lines = updateInfo.updatesTxt.split(/\r?\n/);
  const items: Array<{ key: string; isVersion: boolean; isNew: boolean; text: string }> = [];

  lines.forEach((line, idx) => {
    if (line.includes(' --> ')) {
      const parts = line.split(' --> ');
      items.push({
        key: `v-${idx}`,
        isVersion: true,
        isNew: line.includes('|NEW|'),
        text: `Version ${parts[0]}`,
      });
    } else if (line.includes('- ') && line.length > 2) {
      items.push({
        key: `c-${idx}`,
        isVersion: false,
        isNew: false,
        text: line,
      });
    }
  });

  return (
    <div className="flex min-h-full flex-col bg-[#FAFAFA]">
      <Toolbar title={STRINGS.appName} showBack onBack={onBack} />

      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-[#212121]">
        <h2 className="text-[24px] text-[#008A05]">{STRINGS.newUpdate}</h2>
        <h3 className="text-[18px] text-[#CC0000]">{STRINGS.changelog}</h3>

        <div className="space-y-2 text-[14px]">
          {items.length === 0 ? (
            <p>{STRINGS.pleaseWaitChangelog}</p>
          ) : (
            items.map((item) =>
              item.isVersion ? (
                <p key={item.key} className={`font-bold ${item.isNew ? 'underline' : ''}`}>
                  {item.text}
                </p>
              ) : (
                <p key={item.key}>{item.text}</p>
              )
            )
          )}
        </div>

        <div className="space-y-2 pt-3">
          <button
            type="button"
            onClick={onIgnoreDay}
            className="w-full cursor-pointer rounded-[2px] bg-[#D6D7D7] py-2.5 text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9]"
          >
            {STRINGS.ignoreADay}
          </button>

          {updateInfo.downloadLink && updateInfo.downloadLink !== 'NONE' && (
            <a
              href={updateInfo.downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-[2px] bg-[#D6D7D7] py-2.5 text-center text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9]"
            >
              {STRINGS.downloadInstallUpdate}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
