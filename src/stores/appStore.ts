import { create } from 'zustand';

export type NavTab =
  | 'home'
  | 'quick-measure'
  | 'precision-studio'
  | 'vernier-caliper'
  | 'screw-gauge'
  | 'scientific-instruments'
  | 'unit-converter'
  | 'calibration'
  | 'projects'
  | 'history'
  | 'export'
  | 'image-measurement'
  | 'vernier-height-gauge'
  | 'dial-indicator'
  | 'digital-compass'
  | 'digital-protractor'
  | 'digital-scale'
  | 'thread-pitch-gauge'
  | 'feeler-gauge'
  | 'spirit-level'
  | 'pcd-generator'
  | 'limits-fits'
  | 'material-estimator'
  | 'spherometer'
  | 'metrology-quiz'
  | 'subscription'
  | 'help';

interface AppState {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDemoModalOpen: boolean;
  setIsDemoModalOpen: (open: boolean) => void;
  toast: { message: string; type: 'success' | 'info' | 'warning' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  hideToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  isDemoModalOpen: false,
  setIsDemoModalOpen: (isDemoModalOpen) => set({ isDemoModalOpen }),
  toast: null,
  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set({ toast: null });
    }, 3200);
  },
  hideToast: () => set({ toast: null }),
}));
