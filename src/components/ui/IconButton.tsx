'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface IconButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
  type?: 'button' | 'submit';
  onClick?: () => void;
  loading?: boolean;
}

export function IconButton({
  children,
  className,
  disabled,
  icon,
  type = 'button',
  onClick,
  loading,
}: IconButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      ) : (
        icon
      )}
      <span>{children}</span>
    </motion.button>
  );
}
