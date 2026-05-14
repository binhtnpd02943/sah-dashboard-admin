'use client';

import { Terminal } from 'lucide-react';
import { safeStringify } from '@/services/api-client';
import { motion } from 'framer-motion';

export function ResultPanel({ result }: { result: unknown }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-panel rounded-[24px] p-5"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-2xl bg-sky-400/10 p-3 text-accent">
          <Terminal size={19} />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
            Response
          </p>
          <h2 className="mt-1 text-xl font-black text-main">API result</h2>
        </div>
      </div>
      <pre className="min-h-[260px] overflow-auto rounded-2xl border border-main bg-black/24 p-4 font-mono text-[11px] leading-6 text-muted scrollbar-hide">
        {result ? safeStringify(result) : '{\n  "status": "waiting"\n}'}
      </pre>
    </motion.section>
  );
}
