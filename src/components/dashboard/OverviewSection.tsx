'use client';

import { Activity, Terminal, Zap } from 'lucide-react';

import { HistoryItem, LogItem, UpLevelStatus } from '@/types/dashboard';
import { StatusPill } from '@/components/ui/StatusPill';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { motion } from 'framer-motion';

interface OverviewSectionProps {
  logs: LogItem[];
  history: HistoryItem[];
  lastResult: unknown;
  status: UpLevelStatus | null;
}

export function OverviewSection({
  logs,
  history,
  lastResult,
  status,
}: OverviewSectionProps) {
  const formatDateTime = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('vi-VN');
  };

  const stats = [
    { 
      label: 'Status', 
      value: status?.isRunning ? 'Running' : 'Idle', 
      icon: Activity, 
      color: status?.isRunning ? 'text-emerald-200' : 'text-muted' 
    },
    { 
      label: 'Progress', 
      value: `${status?.completedCount ?? 0} / ${status?.totalCount ?? 0}`, 
      icon: Zap, 
      color: 'text-accent' 
    },
    { 
      label: 'Logs', 
      value: logs.length, 
      icon: Terminal, 
      color: 'text-amber-100' 
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="card-panel rounded-[24px] p-5 group hover:border-accent transition-colors"
            >
              <stat.icon className={stat.color} size={24} />
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-black text-main">{stat.value}</p>
            </motion.div>
          ))}
        </div>
        
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-panel rounded-[28px] p-6"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">
            Tác vụ gần đây
          </p>
          <div className="mt-5 space-y-3">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-main px-4 py-8 text-center text-sm font-bold text-muted opacity-50">
                Chưa có task nào đang chạy.
              </div>
            ) : (
              history.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-main bg-input p-4 transition-colors hover:bg-black/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-main">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-muted">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                    <StatusPill
                      tone={
                        item.status && item.status < 300
                          ? 'success'
                          : 'danger'
                      }
                    >
                      {item.status || '-'}
                    </StatusPill>
                  </div>
                </article>
              ))
            )}
          </div>
        </motion.section>
      </section>
      
      <div className="hidden xl:block">
        <ResultPanel result={lastResult} />
      </div>
    </div>
  );
}
