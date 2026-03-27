import { create } from 'zustand';
import { storage } from '../utils/storage';

interface NotificationState {
  allNotifications: boolean;
  priceChangeNotification: boolean;
  promotionNotification: boolean;
  setAllNotifications: (enabled: boolean) => void;
  setPriceChangeNotification: (enabled: boolean) => void;
  setPromotionNotification: (enabled: boolean) => void;
  restoreSettings: () => Promise<void>;
  syncFromServer: (settings: { notifPriceChange: boolean; notifPromotion: boolean }) => void;
}

const noop = () => undefined;

const NOTIFICATION_STORAGE_KEY = '@nearprice/notification_settings';

export const useNotificationStore = create<NotificationState>((set, get) => ({
  allNotifications: true,
  priceChangeNotification: true,
  promotionNotification: false,

  setAllNotifications: (enabled) => {
    const s = get();
    const newPromotionNotification = enabled ? s.promotionNotification : false;
    set({
      allNotifications: enabled,
      priceChangeNotification: enabled,
      promotionNotification: newPromotionNotification,
    });
    storage
      .set(NOTIFICATION_STORAGE_KEY, {
        allNotifications: enabled,
        priceChangeNotification: enabled,
        promotionNotification: newPromotionNotification,
      })
      .catch(noop);
  },

  setPriceChangeNotification: (enabled) => {
    const s = get();
    const allNotifications = enabled || s.promotionNotification;
    set({ priceChangeNotification: enabled, allNotifications });
    storage
      .set(NOTIFICATION_STORAGE_KEY, {
        allNotifications,
        priceChangeNotification: enabled,
        promotionNotification: s.promotionNotification,
      })
      .catch(noop);
  },

  setPromotionNotification: (enabled) => {
    const s = get();
    const allNotifications = s.priceChangeNotification || enabled;
    set({ promotionNotification: enabled, allNotifications });
    storage
      .set(NOTIFICATION_STORAGE_KEY, {
        allNotifications,
        priceChangeNotification: s.priceChangeNotification,
        promotionNotification: enabled,
      })
      .catch(noop);
  },

  syncFromServer: (settings) => {
    const state = {
      priceChangeNotification: settings.notifPriceChange,
      promotionNotification: settings.notifPromotion,
      allNotifications: settings.notifPriceChange || settings.notifPromotion,
    };
    set(state);
    storage.set(NOTIFICATION_STORAGE_KEY, state).catch(noop);
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
