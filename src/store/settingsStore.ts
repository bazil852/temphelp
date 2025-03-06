import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Settings {
  openaiApiKey?: string;
  heygenApiKey?: string;
}

interface SettingsStore {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  clearSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: {},
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      clearSettings: () => set({ settings: {} }),
    }),
    {
      name: 'settings-storage',
    }
  )
);

export const getSettings = () => useSettingsStore.getState().settings;