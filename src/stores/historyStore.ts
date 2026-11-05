import { useAuthStore } from './authStore';
import { create } from 'zustand';
import { MeasurementHistoryItem } from '../types';

interface HistoryState {
  items: MeasurementHistoryItem[];
  addItem: (item: Omit<MeasurementHistoryItem, 'id' | 'timestamp'>) => void;
  removeItem: (id: string) => void;
  clearHistory: () => void;
  importItems: (
    items: MeasurementHistoryItem[],
    mode: 'skip' | 'replace'
  ) => { added: number; replaced: number; skipped: number };
}

const INITIAL_HISTORY: MeasurementHistoryItem[] = [
  {
    id: 'hist-1',
    tool: 'Precision Studio',
    title: 'A → B • Precision Studio',
    value: '8.56 cm',
    rawNumericValue: 85.6,
    unit: 'cm',
    timestamp: Date.now() - 2 * 60 * 1000, // 2m ago
    details: 'Point A(120, 80) to Point B(360, 240)',
  },
  {
    id: 'hist-2',
    tool: 'Screw Gauge',
    title: 'Screw Gauge',
    value: '24.7 mm',
    rawNumericValue: 24.7,
    unit: 'mm',
    timestamp: Date.now() - 12 * 60 * 1000, // 12m ago
    details: 'Diameter of copper cylinder test sample',
  },
  {
    id: 'hist-3',
    tool: 'Precision Studio',
    title: 'Area • Precision Studio',
    value: '3.2 cm²',
    rawNumericValue: 3.2,
    unit: 'cm²',
    timestamp: Date.now() - 60 * 60 * 1000, // 1h ago
    details: 'Rectangular region area calculation',
  },
  {
    id: 'hist-4',
    tool: 'Vernier Caliper',
    title: 'Internal Diameter • Caliper',
    value: '19.45 mm',
    rawNumericValue: 19.45,
    unit: 'mm',
    timestamp: Date.now() - 3 * 3600 * 1000,
    details: 'Main Scale: 19.0 mm, Vernier Div: 9',
  },
  {
    id: 'hist-5',
    tool: 'Unit Converter',
    title: 'Length Conversion',
    value: '1.50 m = 59.055 in',
    rawNumericValue: 1.5,
    unit: 'in',
    timestamp: Date.now() - 5 * 3600 * 1000,
    details: 'Converted meters to imperial inches',
  },
];

export const useHistoryStore = create<HistoryState>((set) => ({
  items: (() => {
    try {
      const saved = localStorage.getItem('measurex_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_HISTORY;
  })(),
  addItem: (item) => {
    const currentUserId = useAuthStore.getState().user?.id;
    set((state) => {
      const newItem: MeasurementHistoryItem = {
        ...item,
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        userId: item.userId || currentUserId || undefined,
      };
      const updated = [newItem, ...state.items];
      try {
        localStorage.setItem('measurex_history', JSON.stringify(updated.slice(0, 50)));
      } catch (e) {}
      return { items: updated };
    });
  },
  removeItem: (id) => {
    set((state) => {
      const updated = state.items.filter((item) => item.id !== id);
      try {
        localStorage.setItem('measurex_history', JSON.stringify(updated));
      } catch (e) {}
      return { items: updated };
    });
  },
  importItems: (items, mode) => {
    const currentUserId = useAuthStore.getState().user?.id;
    let added = 0;
    let replaced = 0;
    let skipped = 0;

    set((state) => {
      const existingMap = new Map(state.items.map((i) => [i.id, i]));
      const newItems = [...state.items];

      for (const item of items) {
        const itemWithUser: MeasurementHistoryItem = {
          ...item,
          userId: item.userId || currentUserId || undefined,
        };

        if (existingMap.has(item.id)) {
          if (mode === 'replace') {
            const idx = newItems.findIndex((i) => i.id === item.id);
            if (idx !== -1) {
              newItems[idx] = itemWithUser;
              replaced++;
            }
          } else {
            skipped++;
          }
        } else {
          newItems.unshift(itemWithUser);
          existingMap.set(item.id, itemWithUser);
          added++;
        }
      }

      try {
        localStorage.setItem('measurex_history', JSON.stringify(newItems.slice(0, 1000)));
      } catch (e) {}

      return { items: newItems };
    });

    return { added, replaced, skipped };
  },
  clearHistory: () => {
    try {
      localStorage.removeItem('measurex_history');
    } catch (e) {}
    set({ items: [] });
  },
}));
