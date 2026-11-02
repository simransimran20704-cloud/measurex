import { create } from 'zustand';
import { MeasurementPoint, GeometricShape, LengthUnit } from '../types';

export type StudioTool = 'select' | 'point' | 'line' | 'rect' | 'circle' | 'angle' | 'text';

interface StudioState {
  points: MeasurementPoint[];
  shapes: GeometricShape[];
  activeTool: StudioTool;
  selectedId: string | null;
  selectedType: 'point' | 'shape' | null;
  unit: LengthUnit;
  zoom: number;
  pan: { x: number; y: number };
  grid: {
    show: boolean;
    snap: boolean;
    size: number; // in pixels
    snapToPoints: boolean;
  };
  
  // History for Undo/Redo
  history: { points: MeasurementPoint[]; shapes: GeometricShape[] }[];
  historyIndex: number;

  // Actions
  setActiveTool: (tool: StudioTool) => void;
  setUnit: (unit: LengthUnit) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setGrid: (updates: Partial<StudioState['grid']>) => void;
  selectItem: (id: string | null, type?: 'point' | 'shape' | null) => void;
  
  addPoint: (point: Omit<MeasurementPoint, 'id'>) => string;
  updatePoint: (id: string, updates: Partial<MeasurementPoint>) => void;
  deletePoint: (id: string) => void;

  addShape: (shape: Omit<GeometricShape, 'id'>) => string;
  updateShape: (id: string, updates: Partial<GeometricShape>) => void;
  deleteShape: (id: string) => void;

  clearAll: () => void;
  undo: () => void;
  redo: () => void;
  resetView: () => void;
}

const DEFAULT_POINTS: MeasurementPoint[] = [
  { id: 'pt-1', x: 180, y: 140, label: 'A', color: '#4385E8' },
  { id: 'pt-2', x: 420, y: 260, label: 'B', color: '#8064E8' },
];

export const useStudioStore = create<StudioState>((set, get) => ({
  points: DEFAULT_POINTS,
  shapes: [
    {
      id: 'shp-1',
      type: 'line',
      points: [{ x: 180, y: 140 }, { x: 420, y: 260 }],
      label: 'Distance A-B',
      color: '#4385E8',
      strokeWidth: 2,
    }
  ],
  activeTool: 'select',
  selectedId: 'pt-1',
  selectedType: 'point',
  unit: 'cm',
  zoom: 1,
  pan: { x: 50, y: 50 },
  grid: {
    show: true,
    snap: true,
    size: 20,
    snapToPoints: true,
  },
  history: [{ points: DEFAULT_POINTS, shapes: [] }],
  historyIndex: 0,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setUnit: (unit) => set({ unit }),
  setZoom: (zoomOrFn) =>
    set((state) => ({
      zoom: Math.min(4, Math.max(0.2, typeof zoomOrFn === 'function' ? zoomOrFn(state.zoom) : zoomOrFn)),
    })),
  setPan: (panOrFn) =>
    set((state) => ({
      pan: typeof panOrFn === 'function' ? panOrFn(state.pan) : panOrFn,
    })),
  setGrid: (updates) =>
    set((state) => ({
      grid: { ...state.grid, ...updates },
    })),
  selectItem: (id, type = null) => set({ selectedId: id, selectedType: type }),

  addPoint: (p) => {
    const id = `pt-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`;
    const newPoint: MeasurementPoint = { ...p, id };
    set((state) => {
      const nextPoints = [...state.points, newPoint];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ points: nextPoints, shapes: state.shapes });
      return {
        points: nextPoints,
        selectedId: id,
        selectedType: 'point',
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
    return id;
  },

  updatePoint: (id, updates) => {
    set((state) => ({
      points: state.points.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  deletePoint: (id) => {
    set((state) => {
      const nextPoints = state.points.filter((p) => p.id !== id);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ points: nextPoints, shapes: state.shapes });
      return {
        points: nextPoints,
        selectedId: null,
        selectedType: null,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  addShape: (shape) => {
    const id = `shp-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`;
    const newShape: GeometricShape = { ...shape, id };
    set((state) => {
      const nextShapes = [...state.shapes, newShape];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ points: state.points, shapes: nextShapes });
      return {
        shapes: nextShapes,
        selectedId: id,
        selectedType: 'shape',
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
    return id;
  },

  updateShape: (id, updates) => {
    set((state) => ({
      shapes: state.shapes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  },

  deleteShape: (id) => {
    set((state) => {
      const nextShapes = state.shapes.filter((s) => s.id !== id);
      return {
        shapes: nextShapes,
        selectedId: null,
        selectedType: null,
      };
    });
  },

  clearAll: () => {
    set({
      points: [],
      shapes: [],
      selectedId: null,
      selectedType: null,
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex > 0) {
        const prevIndex = state.historyIndex - 1;
        const snapshot = state.history[prevIndex];
        return {
          points: snapshot.points,
          shapes: snapshot.shapes,
          historyIndex: prevIndex,
        };
      }
      return state;
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const nextIndex = state.historyIndex + 1;
        const snapshot = state.history[nextIndex];
        return {
          points: snapshot.points,
          shapes: snapshot.shapes,
          historyIndex: nextIndex,
        };
      }
      return state;
    });
  },

  resetView: () => {
    set({
      zoom: 1,
      pan: { x: 50, y: 50 },
    });
  },
}));
