import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '../utils/storage';

export const RADIUS_OPTIONS = [3000, 5000, 10000, 15000] as const;
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  regionName: string | null;
  radius: RadiusOption;
  setLocation: (lat: number, lng: number, regionName?: string | null) => void;
  setRadius: (radius: RadiusOption) => void;
  clearLocation: () => void;
  restoreLocation: () => Promise<void>;
}

interface PersistedLocation {
  latitude: number;
  longitude: number;
  regionName: string | null;
  radius?: RadiusOption;
}

const noop = () => undefined;

export const useLocationStore = create<LocationState>((set, get) => ({
  latitude: null,
  longitude: null,
  regionName: null,
  radius: 5000,

  setLocation: (latitude, longitude, regionName) => {
    set({ latitude, longitude, regionName: regionName ?? null });
    storage
      .set<PersistedLocation>(STORAGE_KEYS.LOCATION, {
        latitude,
        longitude,
        regionName: regionName ?? null,
        radius: get().radius,
      })
      .catch(noop);
  },

  setRadius: (radius) => {
    set({ radius });
    const { latitude, longitude, regionName } = get();
    if (latitude !== null && longitude !== null) {
      storage
        .set<PersistedLocation>(STORAGE_KEYS.LOCATION, {
          latitude,
          longitude,
          regionName,
          radius,
        })
        .catch(noop);
    }
  },

  clearLocation: () => {
    set({ latitude: null, longitude: null, regionName: null, radius: 5000 });
    storage.remove(STORAGE_KEYS.LOCATION).catch(noop);
  },

  restoreLocation: async () => {
    const saved = await storage.get<PersistedLocation>(STORAGE_KEYS.LOCATION);
    if (saved) {
      set({
        latitude: saved.latitude,
        longitude: saved.longitude,
        regionName: saved.regionName,
        radius: saved.radius ?? 5000,
      });
    }
  },
}));
