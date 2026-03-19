import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '../utils/storage';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  markOnboardingSeen: () => void;
  restoreOnboarding: () => Promise<void>;
}

const noop = () => undefined;

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: false,

  markOnboardingSeen: () => {
    set({ hasSeenOnboarding: true });
    storage.set(STORAGE_KEYS.ONBOARDING_SEEN, true).catch(noop);
  },

  restoreOnboarding: async () => {
    const seen = await storage.get<boolean>(STORAGE_KEYS.ONBOARDING_SEEN);
    if (seen === true) {
      set({ hasSeenOnboarding: true });
    }
  },
}));
