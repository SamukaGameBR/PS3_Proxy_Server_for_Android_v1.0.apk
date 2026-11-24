import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';
import { STRINGS } from '../strings';
import { Toolbar } from '../components/Toolbar';

interface RealtimeLogsScreenProps {
  seeRequests: boolean;
  onBack: () => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const RealtimeLogsScreen: React.FC<RealtimeLogsScreenProps> = ({
  seeRequests,
  onBack,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/logs?seeRequests=${seeRequests ? 'true' : 'false'}`);
      if (res.ok) {
        const data = (await res.json()) as { logs: LogEntry[] };
        setLogs(data.logs);
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveLogs = () => {
    const htmlLines = logs.map(
      (entry) =>
        `<p><u><b>${escapeHtml(entry.timestamp)}</b></u> - <b>${escapeHtml(entry.tag)}</b> ${escapeHtml(entry.message)}</p>`
    );
    const content = htmlLines.join('\n\n');
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PPSFA_Logfile.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMsg(STRINGS.saveLogsSucceeded);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="flex min-h-full flex-col bg-[#FAFAFA]">
      <Toolbar
        title={STRINGS.appName}
        showBack
        onBack={onBack}
        menuItems={[{ label: STRINGS.saveLogs, onClick: handleSaveLogs }]}
      />

      <h2 className="my-2 text-center text-[24px] text-[#008A05]">
        {STRINGS.realtimeLogs}
      </h2>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-2 text-[14px] text-[#212121]"
      >
        {logs.map((entry) => (
          <p key={`${entry.sessionId}-${entry.ln}`} className="break-words leading-snug">
            <u className="font-bold">{entry.timestamp}</u> -{' '}
            <strong className="font-bold">{entry.tag}</strong> {entry.message}
          </p>
        ))}
      </div>

      {toastMsg && (
        <div className="mx-4 mb-2 rounded-full bg-neutral-800/90 px-4 py-2 text-center text-[13px] text-white shadow">
          {toastMsg}
        </div>
      )}

      <div className="p-2">
        <button
          type="button"
          disabled={loading}
          onClick={fetchLogs}
          className="w-full cursor-pointer rounded-[2px] bg-[#D6D7D7] px-4 py-2.5 text-[14px] font-medium uppercase tracking-wide text-[#212121] shadow-sm hover:bg-[#C8C9C9] active:bg-[#BDBDBD] disabled:opacity-60"
        >
          {STRINGS.checkLogs}
        </button>
      </div>
    </div>
  );
};
