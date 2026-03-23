import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '../utils/storage';

interface NotificationState {
  allNotifications: boolean;
  priceChangeNotification: boolean;
  promotionNotification: boolean;
  setAllNotifications: (enabled: boolean) => void;
  setPriceChangeNotification: (enabled: boolean) => void;
  setPromotionNotification: (enabled: boolean) => void;
  restoreSettings: () => Promise<void>;
}

const noop = () => undefined;

const NOTIFICATION_STORAGE_KEY = '@nearprice/notification_settings';

export const useNotificationStore = create<NotificationState>((set) => ({
  allNotifications: true,
  priceChangeNotification: true,
  promotionNotification: false,

  setAllNotifications: (enabled) => {
    set({ allNotifications: enabled });
    storage
      .set(NOTIFICATION_STORAGE_KEY, {
        allNotifications: enabled,
        priceChangeNotification: enabled ? true : false,
        promotionNotification: false,
      })
      .catch(noop);
  },

  setPriceChangeNotification: (enabled) => {
    set((state) => ({
      priceChangeNotification: state.allNotifications ? enabled : false,
    }));
    storage
      .set(NOTIFICATION_STORAGE_KEY, {
        allNotifications: true,
        priceChangeNotification: enabled,
        promotionNotification: false,
      })
      .catch(noop);
  },

  setPromotionNotification: (enabled) => {
    set(() => ({
      promotionNotification: enabled,
    }));
    storage
      .set(NOTIFICATION_STORAGE_KEY, {
        allNotifications: true,
        priceChangeNotification: true,
        promotionNotification: enabled,
      })
      .catch(noop);
  },

  restoreSettings: async () => {
    const settings = await storage.get<{
      allNotifications: boolean;
      priceChangeNotification: boolean;
      promotionNotification: boolean;
    }>(NOTIFICATION_STORAGE_KEY);

    if (settings) {
      set({
        allNotifications: settings.allNotifications,
        priceChangeNotification: settings.priceChangeNotification,
        promotionNotification: settings.promotionNotification,
      });
    }
  },
}));
