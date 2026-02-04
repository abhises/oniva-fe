import { create } from 'zustand';

interface AppState {
  locale: string;
  setLocale: (locale: string) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  locale: 'en',
  setLocale: (locale) => set({ locale }),
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));