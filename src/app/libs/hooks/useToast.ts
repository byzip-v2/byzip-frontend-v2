import { create } from 'zustand';

export type ToastColor = 'primary' | 'error';

interface ToastState {
  id: number;
  msg: string;
  color: ToastColor;
}

interface ToastStore {
  toast: ToastState | null;
  showToast: (msg: string, color?: ToastColor) => void;
  hideToast: () => void;
}

// Zustand 스토어 (내부 관리용)
const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  showToast: (msg, color = 'primary') =>
    set({ toast: { msg, color, id: Date.now() } }),
  hideToast: () => set({ toast: null }),
}));

/**
 * 전역 토스트 사용을 위한 커스텀 훅
 */
export const useToast = () => {
  const toast = useToastStore((state) => state.toast);
  const showToast = useToastStore((state) => state.showToast);
  const hideToast = useToastStore((state) => state.hideToast);

  return {
    toast,
    showToast,
    hideToast,
  };
};
