import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-[2px] bg-amber-600 px-3 py-1.5 text-[12px] font-medium text-white shadow-lg">
      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
      Modo offline — usando dados em cache.
    </div>
  );
};
