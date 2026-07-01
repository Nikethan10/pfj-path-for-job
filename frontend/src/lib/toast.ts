// Tiny framework-agnostic toast store. Call `toast.error(...)` from anywhere
// (even non-React code); <Toaster /> renders the queue.
export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let seq = 1;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l(toasts));
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function push(message: string, type: ToastType) {
  const id = seq++;
  toasts = [...toasts, { id, message, type }];
  emit();
  setTimeout(() => dismiss(id), 4500);
  return id;
}

export const toast = {
  success: (m: string) => push(m, 'success'),
  error: (m: string) => push(m, 'error'),
  info: (m: string) => push(m, 'info'),
};
