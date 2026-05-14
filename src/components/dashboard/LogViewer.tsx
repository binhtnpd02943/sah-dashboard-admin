'use client';

import { FileText, Radio, RefreshCw } from 'lucide-react';
import { LogItem } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogViewerProps {
  logs: LogItem[];
  connected: boolean;
  error: string;
  onRefresh: () => void;
  onClear: () => void;
  tall?: boolean;
}

export function LogViewer({
  logs,
  connected,
  error,
  onRefresh,
  onClear,
  tall = false,
}: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [logs]);

  const kindClass: Record<LogItem['kind'], string> = {
    start: 'border-sky-300/40 bg-sky-400/10 text-sky-100',
    step: 'border-main bg-input text-main',
    success: 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100',
    error: 'border-rose-300/40 bg-rose-400/10 text-rose-100',
    stop: 'border-amber-300/40 bg-amber-400/10 text-amber-100',
  };

  return (
    <section
      className={cn(
        'card-panel flex min-h-0 flex-col overflow-hidden rounded-[24px] transition-all duration-500',
        tall ? 'h-[calc(100vh-12rem)]' : 'h-[560px]'
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-main bg-black/12 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'rounded-full p-2',
              connected
                ? 'bg-emerald-400/10 text-emerald-200'
                : 'bg-rose-400/10 text-rose-200'
            )}
          >
            <Radio size={16} className={connected ? 'animate-pulse' : ''} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[11px] font-black uppercase tracking-[0.18em] text-main">
              Up Level Logs
            </h3>
            <p className="mt-1 truncate text-[10px] text-muted">
              {connected
                ? 'Đang stream realtime từ worker.'
                : error || 'Chưa kết nối log stream.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            title="Tải lại lịch sử log"
            className="btn-secondary flex h-9 w-9 items-center justify-center rounded-xl transition-transform hover:rotate-180 duration-500"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={onClear}
            title="Xóa log trên màn hình"
            className="btn-danger flex h-9 w-9 items-center justify-center rounded-xl"
          >
            <FileText size={14} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto bg-black/16 p-4 font-mono text-[12px] leading-relaxed scroll-smooth scrollbar-hide"
      >
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center font-sans text-sm font-bold text-muted opacity-50">
            Chưa có log mới. Start Up Level xong log sẽ chảy realtime ở đây.
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.article
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'rounded-2xl border p-3 shadow-sm',
                    kindClass[log.kind]
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-current/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em]">
                      {log.kind}
                    </span>
                    {log.configName && (
                      <span className="rounded-full border border-main bg-black/20 px-2 py-0.5 text-[9px] font-bold">
                        {log.configName}
                      </span>
                    )}
                    {log.userToken && (
                      <span className="rounded-full border border-main bg-black/20 px-2 py-0.5 text-[9px] text-muted font-mono">
                        {log.userToken}
                      </span>
                    )}
                    <span className="ml-auto text-[9px] uppercase tracking-[0.14em] text-muted">
                      {log.time}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-5 text-main font-mono">
                    {log.message}
                  </p>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
