import React from 'react';
import { STRINGS } from '../strings';
import { Toolbar } from '../components/Toolbar';

interface CreditsScreenProps {
  onBack: () => void;
}

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ onBack }) => {
  return (
    <div className="flex min-h-full flex-col bg-[#FAFAFA]">
      <Toolbar title={STRINGS.appName} showBack onBack={onBack} />

      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-[15px] leading-relaxed text-[#212121]">
        <h2 className="text-[34px] text-[#008A05]">{STRINGS.credits}</h2>
        <p>{STRINGS.credits1}</p>
        <p>{STRINGS.credits2}</p>
        <p>{STRINGS.credits3}</p>
        <p className="break-words">{STRINGS.credits4}</p>

        <a
          href="https://github.com/mondul/PS3-Proxy"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-[2px] bg-[#D6D7D7] py-2.5 text-center text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9]"
        >
          {STRINGS.visitWebsite}
        </a>

        <h3 className="pt-2 text-[24px] text-[#CC0000]">{STRINGS.credits5}</h3>
        <p>{STRINGS.credits6}</p>
        <p>{STRINGS.credits7}</p>
        <p className="break-all">{STRINGS.credits8}</p>

        <a
          href="https://www.psx-place.com/threads/tutorial-how-to-set-up-ps3-proxy-server-on-android.22846/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-[2px] bg-[#D6D7D7] py-2.5 text-center text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9]"
        >
          {STRINGS.visitWebsite}
        </a>

        <h3 className="pt-2 text-[18px] text-[#FFBB33]">{STRINGS.credits9}</h3>
        <p>{STRINGS.credits10}</p>
        <p className="break-all">{STRINGS.credits11}</p>

        <a
          href="https://www.psx-place.com/resources/ps3-proxy-server-for-android.795/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-[2px] bg-[#D6D7D7] py-2.5 text-center text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9]"
        >
          {STRINGS.visitWebsite}
        </a>
      </div>
    </div>
  );
};
