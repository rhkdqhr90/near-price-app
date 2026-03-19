import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

// 타이머는 리액티브 상태가 아니므로 Zustand 외부 모듈 스코프로 분리
let _timer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  type: 'success',
  showToast: (message, type = 'success') => {
    if (_timer) {
      clearTimeout(_timer);
    }
    set({ visible: true, message, type });
    _timer = setTimeout(() => {
      set({ visible: false });
      _timer = null;
    }, 2000);
  },
  hideToast: () => {
    if (_timer) {
      clearTimeout(_timer);
      _timer = null;
    }
    set({ visible: false });
  },
}));
