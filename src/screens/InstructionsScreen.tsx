import React from 'react';
import { STRINGS } from '../strings';
import { Toolbar } from '../components/Toolbar';

interface InstructionsScreenProps {
  onBack: () => void;
}

export const InstructionsScreen: React.FC<InstructionsScreenProps> = ({ onBack }) => {
  return (
    <div className="flex min-h-full flex-col bg-[#FAFAFA]">
      <Toolbar title={STRINGS.appName} showBack onBack={onBack} />

      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-[15px] leading-relaxed text-[#212121]">
        <h2 className="text-[34px] text-[#008A05]">{STRINGS.instructions}</h2>

        <h3 className="text-[24px] text-[#FF8800]">{STRINGS.instructionsOnPs3}</h3>
        <p>{STRINGS.instructions01}</p>

        <h3 className="text-[24px] text-[#FF8800]">{STRINGS.instructionsOnApp}</h3>
        <p>{STRINGS.instructions02}</p>
        <p>{STRINGS.instructions03}</p>
        <p>{STRINGS.instructions04}</p>
        <p>{STRINGS.instructions05}</p>
        <p>{STRINGS.instructions06}</p>
        <p>{STRINGS.instructions07}</p>
        <p>{STRINGS.instructions08}</p>
        <p>{STRINGS.instructions09}</p>
        <p>{STRINGS.instructions10}</p>
      </div>
    </div>
  );
};
