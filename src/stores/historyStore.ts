import { create } from 'zustand';
import { MeasurementHistoryItem } from '../types';

interface HistoryState {
  items: MeasurementHistoryItem[];
  addItem: (item: Omit<MeasurementHistoryItem, 'id' | 'timestamp'>) => void;
  removeItem: (id: string) => void;
  clearHistory: () => void;
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
    set((state) => {
      const newItem: MeasurementHistoryItem = {
        ...item,
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
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
  clearHistory: () => {
    try {
      localStorage.removeItem('measurex_history');
    } catch (e) {}
    set({ items: [] });
  },
}));
