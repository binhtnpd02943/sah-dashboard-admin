'use client';

import { BadgeCheck, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { LoadingAction } from '@/types/dashboard';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { IconButton } from '@/components/ui/IconButton';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface LoginSectionProps {
  loginForm: { username: ''; password: '' };
  setLoginForm: (form: any) => void;
  onLogin: (e: React.FormEvent) => void;
  loading: LoadingAction;
  lastResult: unknown;
}

export function LoginSection({
  loginForm,
  setLoginForm,
  onLogin,
  loading,
  lastResult,
}: LoginSectionProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section className="grid gap-6 xl:grid-cols-[0.8fr_0.6fr] items-start">
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={onLogin}
        className="card-panel rounded-[30px] p-8"
      >
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">
              Security
            </p>
            <h3 className="mt-2 text-3xl font-black text-main">Đăng nhập</h3>
          </div>
          <span className="rounded-2xl bg-sky-400/10 p-3 text-accent shadow-lg shadow-sky-500/10">
            <BadgeCheck size={28} />
          </span>
        </div>
        
        <div className="grid gap-5">
          <FieldLabel label="Username">
            <input
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm((prev: any) => ({ ...prev, username: e.target.value }))
              }
              className="field min-h-12 rounded-2xl px-5 py-3 text-sm"
              autoComplete="username"
              required
            />
          </FieldLabel>
          
          <FieldLabel label="Mật khẩu">
            <div className="relative">
              <input
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((prev: any) => ({ ...prev, password: e.target.value }))
                }
                type={showPassword ? 'text' : 'password'}
                className="field min-h-12 rounded-2xl px-5 py-3 pr-14 text-sm"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:text-main hover:bg-white/5"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </FieldLabel>
        </div>
        
        <IconButton
          type="submit"
          className="btn-primary mt-10 w-full text-base py-4"
          loading={loading === 'login'}
          icon={<ShieldCheck size={18} />}
        >
          Xác thực hệ thống
        </IconButton>
      </motion.form>
      
      <ResultPanel result={lastResult} />
    </section>
  );
}
