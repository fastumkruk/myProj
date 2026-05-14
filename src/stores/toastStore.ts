import { create } from "zustand";

type Toast = {
  id: string;
  message: string;
};

type ToastState = {
  toasts: Toast[];
  push: (message: string) => void;
  remove: (id: string) => void;
};

function id() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message) => {
    const toast: Toast = { id: id(), message };
    set((s) => ({ toasts: [toast, ...s.toasts].slice(0, 3) }));
    window.setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== toast.id) }));
    }, 3500);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

