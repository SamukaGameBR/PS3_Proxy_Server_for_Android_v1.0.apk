import React, { useEffect, useRef, useState } from 'react';
import { PWAInstallButton } from './PWAInstallButton';

export interface ToolbarMenuItem {
  label: string;
  onClick: () => void;
}

interface ToolbarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  menuItems?: ToolbarMenuItem[];
}

export const Toolbar: React.FC<ToolbarProps> = ({
  title,
  showBack = false,
  onBack,
  menuItems = [],
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpen]);

  return (
    <header className="relative z-20 flex h-14 w-full shrink-0 items-center justify-between bg-[#B80000] px-2 text-white shadow-md">
      <div className="flex min-w-0 items-center">
        {showBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="mr-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
        )}
        <h1 className="truncate px-2 text-[20px] font-medium tracking-tight">{title}</h1>
      </div>

      <div className="flex shrink-0 items-center">
        <PWAInstallButton />
        {menuItems.length > 0 && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Mais opções"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-30 min-w-[230px] rounded bg-white py-1 text-[#212121] shadow-lg ring-1 ring-black/10">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    item.onClick();
                  }}
                  className="block w-full cursor-pointer px-4 py-3 text-left text-[15px] hover:bg-neutral-100 active:bg-neutral-200"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          </div>
        )}
      </div>
    </header>
  );
};
