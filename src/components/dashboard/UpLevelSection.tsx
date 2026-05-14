'use client';

import { Play, Square } from 'lucide-react';
import { UpLevelForm, LoadingAction, LogItem, UpLevelStatus } from '@/types/dashboard';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { IconButton } from '@/components/ui/IconButton';
import { LogViewer } from '@/components/dashboard/LogViewer';
import { safeStringify } from '@/services/api-client';
import { motion } from 'framer-motion';
import { StatusPill } from '@/components/ui/StatusPill';

interface UpLevelSectionProps {
  upLevelForm: UpLevelForm;
  setUpLevelForm: (form: UpLevelForm | ((prev: UpLevelForm) => UpLevelForm)) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  loading: LoadingAction;
  logs: LogItem[];
  logConnected: boolean;
  logError: string;
  onRefreshLogs: () => void;
  onClearLogs: () => void;
  status: UpLevelStatus | null;
}

export function UpLevelSection({
  upLevelForm,
  setUpLevelForm,
  onSubmit,
  onStop,
  loading,
  logs,
  logConnected,
  logError,
  onRefreshLogs,
  onClearLogs,
  status,
}: UpLevelSectionProps) {
  const parseConfigIds = (value: string) => {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const parsedConfigIds = parseConfigIds(upLevelForm.configIds);
  
  const upLevelPayload = {
    configIds: parsedConfigIds,
    delay: upLevelForm.delay,
    type: upLevelForm.type,
    concurrency: upLevelForm.concurrency,
    autoBuyStamina: upLevelForm.autoBuyStamina,
    autoDeleteTrash: upLevelForm.autoDeleteTrash,
    logFull: upLevelForm.logFull,
    proxyMode: upLevelForm.proxyMode,
  };

  const checkboxFields: Array<[keyof UpLevelForm, string]> = [
    ['autoBuyStamina', 'Tự động mua thể lực'],
    ['autoDeleteTrash', 'Auto xóa tướng rác'],
    ['logFull', 'Log full'],
  ];

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(440px,0.85fr)]">
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={onSubmit}
        className="card-panel rounded-[30px] p-6 h-fit"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">
              Feature
            </p>
            <h3 className="mt-2 text-2xl font-black text-main">Up Level Clone</h3>
          </div>
          <span className="rounded-2xl bg-sky-400/10 p-3 text-accent">
            <Play size={22} />
          </span>
        </div>
        
        <div className="mb-8 p-4 rounded-2xl bg-black/20 border border-main">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Trạng thái hệ thống</span>
            <StatusPill tone={status?.isRunning ? 'success' : 'neutral'}>
              {status?.isRunning ? 'Đang chạy' : 'Đang chờ'}
            </StatusPill>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-black/20 border border-main">
              <p className="text-[9px] font-black uppercase text-muted mb-1">Hoàn thành</p>
              <p className="text-lg font-black text-main">{status?.completedCount ?? 0} / {status?.totalCount ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/20 border border-main">
              <p className="text-[9px] font-black uppercase text-muted mb-1">Trong hàng đợi</p>
              <p className="text-lg font-black text-accent">{status?.currentQueue?.length ?? 0}</p>
            </div>
          </div>
          
          {status?.isRunning && status.totalCount > 0 && (
            <div className="mt-4">
              <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(status.completedCount / status.totalCount) * 100}%` }}
                  className="h-full bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-5">
          <FieldLabel label="Config IDs">
            <textarea
              value={upLevelForm.configIds}
              onChange={(e) =>
                setUpLevelForm((prev) => ({ ...prev, configIds: e.target.value }))
              }
              className="field min-h-32 rounded-2xl px-4 py-3 font-mono text-[13px] leading-relaxed"
              placeholder="vr3147486492\nvr..."
              required
            />
          </FieldLabel>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldLabel label="Delay">
              <input
                value={upLevelForm.delay}
                onChange={(e) =>
                  setUpLevelForm((prev) => ({ ...prev, delay: Number(e.target.value) }))
                }
                type="number"
                min={1}
                className="field min-h-12 rounded-2xl px-4 py-3 text-sm"
              />
            </FieldLabel>
            
            <FieldLabel label="Loại">
              <select
                value={upLevelForm.type}
                onChange={(e) =>
                  setUpLevelForm((prev) => ({ ...prev, type: Number(e.target.value) }))
                }
                className="field min-h-12 rounded-2xl px-4 py-3 text-sm"
              >
                <option value={1}>Up Level Clone</option>
                <option value={2}>Up 250</option>
              </select>
            </FieldLabel>
            
            <FieldLabel label="Concurrency">
              <input
                value={upLevelForm.concurrency}
                onChange={(e) =>
                  setUpLevelForm((prev) => ({
                    ...prev,
                    concurrency: Number(e.target.value),
                  }))
                }
                type="number"
                min={1}
                className="field min-h-12 rounded-2xl px-4 py-3 text-sm"
              />
            </FieldLabel>
          </div>
          
          <FieldLabel label="Proxy Mode">
            <select
              value={upLevelForm.proxyMode}
              onChange={(e) =>
                setUpLevelForm((prev) => ({
                  ...prev,
                  proxyMode: e.target.value as UpLevelForm['proxyMode'],
                }))
              }
              className="field min-h-12 rounded-2xl px-4 py-3 text-sm"
            >
              <option value="off">Off</option>
              <option value="dedicated">Dedicated</option>
            </select>
          </FieldLabel>
          
          <div className="grid gap-3 sm:grid-cols-3">
            {checkboxFields.map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-12 items-center gap-3 rounded-2xl border border-main bg-input px-4 py-3 text-[12px] font-bold text-main cursor-pointer hover:border-accent/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={Boolean(upLevelForm[key])}
                  onChange={(e) =>
                    setUpLevelForm((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-accent rounded"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="mt-8 flex gap-3">
          <IconButton
            type="submit"
            className="btn-primary flex-1"
            loading={loading === 'up-level'}
            disabled={parsedConfigIds.length === 0}
            icon={<Play size={16} />}
          >
            Chạy ngay ({parsedConfigIds.length})
          </IconButton>
          
          <IconButton
            type="button"
            onClick={onStop}
            className="btn-danger px-6"
            loading={loading === 'up-level'}
            icon={<Square size={16} fill="currentColor" />}
          >
            Stop
          </IconButton>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted mb-3">
            Payload Preview
          </p>
          <pre className="overflow-auto rounded-2xl border border-main bg-black/24 p-4 font-mono text-[10px] leading-relaxed text-muted scrollbar-hide">
            {safeStringify(upLevelPayload)}
          </pre>
        </motion.div>
      </motion.form>
      
      <LogViewer
        logs={logs}
        connected={logConnected}
        error={logError}
        onRefresh={onRefreshLogs}
        onClear={onClearLogs}
      />
    </section>
  );
}
