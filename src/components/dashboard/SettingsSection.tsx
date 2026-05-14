'use client';

import { Settings, User } from 'lucide-react';
import { Session } from '@/types/dashboard';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { motion } from 'framer-motion';

interface SettingsSectionProps {
  workerUrl: string;
  setWorkerUrl: (url: string) => void;
  session: Session | null;
  lastResult: unknown;
}

export function SettingsSection({
  workerUrl,
  setWorkerUrl,
  session,
  lastResult,
}: SettingsSectionProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(360px,0.75fr)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-panel rounded-[30px] p-6 h-fit"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">
              System
            </p>
            <h3 className="mt-2 text-2xl font-black text-main">Cài đặt</h3>
          </div>
          <span className="rounded-2xl bg-white/5 p-3 text-muted">
            <Settings size={22} />
          </span>
        </div>
        
        <div className="grid gap-6">
          <FieldLabel label="Worker URL">
            <input
              value={workerUrl}
              onChange={(e) => setWorkerUrl(e.target.value)}
              className="field min-h-12 rounded-2xl px-4 py-3 font-mono text-sm"
              placeholder="https://worker4-2.tool-sah.pro.vn"
            />
            <p className="mt-2 text-[10px] text-muted leading-relaxed">
              * Thay đổi Worker URL sẽ ngắt kết nối Log stream hiện tại và lưu vào trình duyệt.
            </p>
          </FieldLabel>
          
          <div className="rounded-2xl border border-main bg-input p-5 space-y-4">
            <div className="flex items-center gap-3 text-accent mb-2">
              <User size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Thông tin User</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                  User ID
                </p>
                <p className="mt-1 break-all font-mono text-sm text-main">
                  {session?.userId || '-'}
                </p>
              </div>
              
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                  Username
                </p>
                <p className="mt-1 font-black text-main">
                  {session?.username || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      <div className="space-y-6">
        <ResultPanel result={lastResult} />
      </div>
    </section>
  );
}
