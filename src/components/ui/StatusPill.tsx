'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

export function StatusPill({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  const tones: Record<Tone, string> = {
    success: 'border-emerald-300/40 bg-emerald-400/10 text-emerald-200',
    warning: 'border-amber-300/40 bg-amber-400/10 text-amber-100',
    danger: 'border-rose-300/40 bg-rose-400/10 text-rose-200',
    accent: 'border-sky-300/40 bg-sky-400/10 text-sky-200',
    neutral: 'border-main bg-input text-muted',
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]',
        tones[tone],
        className
      )}
    >
      {children}
    </motion.span>
  );
}
