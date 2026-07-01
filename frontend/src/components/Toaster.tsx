import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { subscribe, dismiss, type ToastItem } from '../lib/toast';

const STYLES: Record<string, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-slate-200 bg-white text-slate-800',
};

const ICON: Record<string, string> = { success: '✓', error: '!', info: 'i' };

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => subscribe(setItems), []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${STYLES[t.type] || STYLES.info}`}
            role="status"
          >
            <span className="mt-0.5 font-bold">{ICON[t.type] || 'i'}</span>
            <p className="text-sm font-medium flex-1 break-words">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="opacity-60 hover:opacity-100 text-sm leading-none"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
