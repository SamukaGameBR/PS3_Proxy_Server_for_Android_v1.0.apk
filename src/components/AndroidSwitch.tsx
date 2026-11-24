import React from 'react';

interface AndroidSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}

export const AndroidSwitch: React.FC<AndroidSwitchProps> = ({
  checked,
  disabled = false,
  onChange,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onChange(!checked);
        }
      }}
      className={`relative my-2 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'
      } ${checked ? 'bg-[#008A05]/50' : 'bg-neutral-400/70'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full shadow transition-transform ${
          checked ? 'translate-x-4 bg-[#008A05]' : 'translate-x-0 bg-[#FAFAFA] ring-1 ring-black/15'
        }`}
      />
    </button>
  );
};
