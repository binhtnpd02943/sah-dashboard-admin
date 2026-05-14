'use client';

import { Plus, UserPlus } from 'lucide-react';
import { AccountForm, LoadingAction } from '@/types/dashboard';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { IconButton } from '@/components/ui/IconButton';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { safeStringify } from '@/services/api-client';
import { motion } from 'framer-motion';

interface AccountSectionProps {
  accountForm: AccountForm;
  setAccountForm: (form: AccountForm | ((prev: AccountForm) => AccountForm)) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: LoadingAction;
  lastResult: unknown;
}

export function AccountSection({
  accountForm,
  setAccountForm,
  onSubmit,
  loading,
  lastResult,
}: AccountSectionProps) {
  const accountPayload = {
    phoneNumber: accountForm.phoneNumber.trim(),
    password: accountForm.password ? '********' : '',
    platform: accountForm.platform,
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(340px,0.8fr)]">
      <motion.form
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onSubmit={onSubmit}
        className="card-panel rounded-[30px] p-6 h-fit"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">
              Account
            </p>
            <h3 className="mt-2 text-2xl font-black text-main">Tạo account</h3>
          </div>
          <span className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-200">
            <UserPlus size={22} />
          </span>
        </div>
        
        <div className="grid gap-5">
          <FieldLabel label="Số điện thoại">
            <input
              value={accountForm.phoneNumber}
              onChange={(e) =>
                setAccountForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
              }
              className="field min-h-12 rounded-2xl px-4 py-3 text-sm"
              placeholder="84385561507"
              required
            />
          </FieldLabel>
          
          <FieldLabel label="Mật khẩu">
            <input
              value={accountForm.password}
              onChange={(e) =>
                setAccountForm((prev) => ({ ...prev, password: e.target.value }))
              }
              type="password"
              className="field min-h-12 rounded-2xl px-4 py-3 text-sm"
              required
            />
          </FieldLabel>
          
          <FieldLabel label="Platform">
            <select
              value={accountForm.platform}
              onChange={(e) =>
                setAccountForm((prev) => ({
                  ...prev,
                  platform: e.target.value as AccountForm['platform'],
                }))
              }
              className="field min-h-12 rounded-2xl px-4 py-3 text-sm"
            >
              <option value="ios">IOS</option>
              <option value="android">Android</option>
            </select>
          </FieldLabel>
        </div>
        
        <IconButton
          type="submit"
          className="btn-success mt-8 w-full"
          loading={loading === 'account'}
          icon={<Plus size={16} />}
        >
          Thêm Account
        </IconButton>
      </motion.form>
      
      <motion.section 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        <div className="card-panel rounded-[24px] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
            Payload Preview
          </p>
          <pre className="mt-4 overflow-auto rounded-2xl border border-main bg-black/24 p-4 font-mono text-[11px] leading-6 text-muted scrollbar-hide">
            {safeStringify(accountPayload)}
          </pre>
        </div>
        <ResultPanel result={lastResult} />
      </motion.section>
    </section>
  );
}
