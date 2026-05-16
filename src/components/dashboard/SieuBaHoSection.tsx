'use client';

import { Play, Square, Crown } from 'lucide-react';
import { SieuBaHoForm, LoadingAction, LogItem, SieuBaHoStatus } from '@/types/dashboard';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { IconButton } from '@/components/ui/IconButton';
import { LogViewer } from '@/components/dashboard/LogViewer';
import { safeStringify } from '@/services/api-client';
import { motion } from 'framer-motion';
import { StatusPill } from '@/components/ui/StatusPill';

interface SieuBaHoSectionProps {
  form: SieuBaHoForm;
  setForm: (form: SieuBaHoForm | ((prev: SieuBaHoForm) => SieuBaHoForm)) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  loading: LoadingAction;
  logs: LogItem[];
  logConnected: boolean;
  logError: string;
  onRefreshLogs: () => void;
  onClearLogs: () => void;
  status: SieuBaHoStatus | null;
}

export function SieuBaHoSection({
  form,
  setForm,
  onSubmit,
  onStop,
  loading,
  logs,
  logConnected,
  logError,
  onRefreshLogs,
  onClearLogs,
  status,
}: SieuBaHoSectionProps) {
  const parsedConfigIds = form.configIds
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);

  const previewPayload = {
    configIds: parsedConfigIds,
    delay: form.delay,
    concurrency: form.concurrency,
    maxAuto: form.maxAuto,
    buyItems: form.buyItems,
    runMode: form.runMode,
    buyShopIndex: form.buyShopIndex,
    buyShopSlot: form.buyShopSlot,
    buyQuantity: form.buyQuantity,
    logFull: form.logFull,
    proxyMode: form.proxyMode,
  };

  const isBusy = loading === 'sieu-ba-ho';

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(440px,0.85fr)]">
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={onSubmit}
        className="card-panel rounded-[30px] p-6 h-fit"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">
              Feature
            </p>
            <h3 className="mt-2 text-2xl font-black text-main">Siêu Bá Hộ</h3>
          </div>
          <span className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-400">
            <Crown size={22} />
          </span>
        </div>

        {/* Status card */}
        <div className="mb-8 p-4 rounded-2xl bg-black/20 border border-main">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">
              Trạng thái hệ thống
            </span>
            <StatusPill tone={status?.isRunning ? 'success' : 'neutral'}>
              {status?.isRunning ? 'Đang chạy' : 'Đang chờ'}
            </StatusPill>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-black/20 border border-main">
              <p className="text-[9px] font-black uppercase text-muted mb-1">Hoàn thành</p>
              <p className="text-lg font-black text-main">
                {status?.completedCount ?? 0} / {status?.totalCount ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-black/20 border border-main">
              <p className="text-[9px] font-black uppercase text-muted mb-1">Hàng đợi</p>
              <p className="text-lg font-black text-yellow-400">
                {status?.currentQueue?.length ?? 0}
              </p>
            </div>
          </div>

          {status?.isRunning && (status.totalCount ?? 0) > 0 && (
            <div className="mt-4">
              <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((status.completedCount ?? 0) / (status.totalCount ?? 1)) * 100}%`,
                  }}
                  className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Form fields */}
        <div className="grid gap-5">
          {/* Config IDs */}
          <FieldLabel label="Config IDs">
            <textarea
              value={form.configIds}
              onChange={(e) => setForm((prev) => ({ ...prev, configIds: e.target.value }))}
              className="field min-h-32 rounded-2xl px-4 py-3 font-mono text-[13px] leading-relaxed"
              placeholder={'vr3147486492\nvr...'}
              required
            />
          </FieldLabel>

          {/* Delay / Concurrency / Max Auto */}
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldLabel label="Delay (ms)">
              <input
                type="number"
                min={100}
                value={form.delay}
                onChange={(e) => setForm((prev) => ({ ...prev, delay: Number(e.target.value) }))}
                className="field min-h-12 rounded-2xl px-4 py-3 text-sm"
              />
            </FieldLabel>
            <FieldLabel label="Concurrency">
              <input
                type="number"
                min={1}
                value={form.concurrency}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, concurrency: Number(e.target.value) }))
                }
                className="field min-h-12 rounded-2xl px-4 py-3 text-sm"
              />
            </FieldLabel>
            <FieldLabel label="Max Auto">
              <input
                type="number"
                min={1}
                value={form.maxAuto}
                onChange={(e) => setForm((prev) => ({ ...prev, maxAuto: Number(e.target.value) }))}
                className="field min-h-12 rounded-2xl px-4 py-3 text-sm"
              />
            </FieldLabel>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex gap-3">
          <IconButton
            type="submit"
            className="btn-primary flex-1"
            loading={isBusy}
            disabled={parsedConfigIds.length === 0}
            icon={<Crown size={16} />}
          >
            Chạy Siêu Bá Hộ ({parsedConfigIds.length})
          </IconButton>
          <IconButton
            type="button"
            onClick={onStop}
            className="btn-danger px-6"
            loading={isBusy}
            icon={<Square size={16} fill="currentColor" />}
          >
            Stop
          </IconButton>
        </div>

        {/* Payload preview */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted mb-3">
            Payload Preview
          </p>
          <pre className="overflow-auto rounded-2xl border border-main bg-black/24 p-4 font-mono text-[10px] leading-relaxed text-muted scrollbar-hide">
            {safeStringify(previewPayload)}
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
