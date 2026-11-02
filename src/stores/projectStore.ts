import { create } from 'zustand';
import { ProjectItem } from '../types';
import { apiClient } from '../services/apiClient';

interface ProjectState {
  projects: ProjectItem[];
  activeProjectId: string | null;
  setActiveProject: (id: string | null) => void;
  createProject: (title: string, type: ProjectItem['type']) => string;
  updateProject: (id: string, updates: Partial<ProjectItem>) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
}

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-1',
    title: 'Engineering Drawing',
    type: 'Precision Studio',
    lastModified: Date.now() - 2 * 3600 * 1000, // 2h ago
    description: 'Mechanical bracket component layout with synchronized 3-sided rulers',
    pointsCount: 14,
  },
  {
    id: 'proj-2',
    title: 'Caliper Measurements',
    type: 'Instruments',
    lastModified: Date.now() - 24 * 3600 * 1000, // 1d ago
    description: 'Precision shaft internal and external diameter quality verification',
    pointsCount: 8,
  },
  {
    id: 'proj-3',
    title: 'Lab Experiment',
    type: 'Workspace',
    lastModified: Date.now() - 48 * 3600 * 1000, // 2d ago
    description: 'Physics lab calibration trial & screw gauge wire thickness measurements',
    pointsCount: 6,
  },
];

export const useProjectStore = create<ProjectState>((set) => ({
  projects: (() => {
    try {
      const saved = localStorage.getItem('measurex_projects');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PROJECTS;
  })(),
  activeProjectId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),
  createProject: (title, type) => {
    const id = `proj-${Date.now()}`;
    const newProject: ProjectItem = {
      id,
      title,
      type,
      lastModified: Date.now(),
      description: 'Newly created measurement project',
      pointsCount: 0,
    };
    if (typeof window !== 'undefined') {
      apiClient.projects.create(title, type, 'Newly created measurement project').catch(() => {});
    }
    set((state) => {
      const updated = [newProject, ...state.projects];
      try {
        localStorage.setItem('measurex_projects', JSON.stringify(updated));
      } catch (e) {}
      return { projects: updated, activeProjectId: id };
    });
    return id;
  },
  updateProject: (id, updates) => {
    if (typeof window !== 'undefined') {
      apiClient.projects.update(id, updates).catch(() => {});
    }
    set((state) => {
      const updated = state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, lastModified: Date.now() } : p
      );
      try {
        localStorage.setItem('measurex_projects', JSON.stringify(updated));
      } catch (e) {}
      return { projects: updated };
    });
  },
  deleteProject: (id) => {
    if (typeof window !== 'undefined') {
      apiClient.projects.delete(id).catch(() => {});
    }
    set((state) => {
      const updated = state.projects.filter((p) => p.id !== id);
      try {
        localStorage.setItem('measurex_projects', JSON.stringify(updated));
      } catch (e) {}
      return { projects: updated, activeProjectId: state.activeProjectId === id ? null : state.activeProjectId };
    });
  },
  duplicateProject: (id) => {
    set((state) => {
      const target = state.projects.find((p) => p.id === id);
      if (!target) return state;
      const duplicated: ProjectItem = {
        ...target,
        id: `proj-${Date.now()}`,
        title: `${target.title} (Copy)`,
        lastModified: Date.now(),
      };
      const updated = [duplicated, ...state.projects];
      try {
        localStorage.setItem('measurex_projects', JSON.stringify(updated));
      } catch (e) {}
      return { projects: updated };
    });
  },
}));
