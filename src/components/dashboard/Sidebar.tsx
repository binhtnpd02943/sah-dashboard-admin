'use client';

import {
  Bot,
  CheckCircle2,
  CircleAlert,
  LogOut,
  Radio,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { NavItem, ActiveScreen, Session } from '@/types/dashboard';
import { StatusPill } from '@/components/ui/StatusPill';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SidebarProps {
  session: Session | null;
  activeScreen: ActiveScreen;
  onScreenChange: (screen: ActiveScreen) => void;
  navItems: NavItem[];
  workerUrl: string;
  logConnected: boolean;
  onLogout: () => void;
}

export function Sidebar({
  session,
  activeScreen,
  onScreenChange,
  navItems,
  workerUrl,
  logConnected,
  onLogout,
}: SidebarProps) {
  const isLoggedIn = !!session;

  const maskToken = (token: string) => {
    if (token.length <= 18) return token;
    return `${token.slice(0, 12)}...${token.slice(-8)}`;
  };

  return (
    <aside className="card-panel h-fit rounded-[30px] p-5 lg:sticky lg:top-5">
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-sky-400/10 p-3 text-accent">
          <Bot size={24} />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted">
            SAH Tool
          </p>
          <h1 className="mt-1 text-xl font-black text-main">Dashboard</h1>
        </div>
      </div>

      {session && (
        <nav className="mt-6 space-y-2">
          {navItems.map((item) => {
            const active = activeScreen === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onScreenChange(item.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[20px] border px-4 py-3 text-left text-sm font-black transition-all group',
                  active
                    ? 'border-sky-300/35 bg-sky-400/10 text-main'
                    : 'border-transparent bg-input text-muted hover:border-main hover:text-main'
                )}
              >
                <span className={cn(
                  'rounded-xl p-2 transition-colors',
                  active ? 'bg-black/18 text-accent' : 'bg-black/10 text-subtle group-hover:text-accent'
                )}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
      )}

      <div className="mt-6 space-y-3">
        <StatusPill tone={isLoggedIn ? 'success' : 'warning'}>
          {isLoggedIn ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}
          {isLoggedIn ? 'Authenticated' : 'Guest'}
        </StatusPill>
        
        <div className="rounded-2xl border border-main bg-input p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
            Worker
          </p>
          <p className="mt-2 break-all font-mono text-[11px] text-main">
            {workerUrl}
          </p>
        </div>
      </div>

      {session && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-2xl border border-main bg-black/16 p-4"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
            Session
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">User</dt>
              <dd className="font-black text-main">{session.username}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Token</dt>
              <dd className="font-mono text-[10px] text-accent">
                {maskToken(session.token)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Logs</dt>
              <dd className="font-black text-main">
                {logConnected ? 'Live' : 'Offline'}
              </dd>
            </div>
          </dl>
          <IconButton
            className="btn-danger mt-5 w-full text-xs"
            icon={<LogOut size={14} />}
            onClick={onLogout}
          >
            Đăng xuất
          </IconButton>
        </motion.div>
      )}
    </aside>
  );
}
