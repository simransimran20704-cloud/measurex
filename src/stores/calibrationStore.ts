import { create } from 'zustand';
import { CalibrationProfile } from '../types';
import { loadSavedCalibration, saveCalibration, DEFAULT_PIXELS_PER_MM } from '../engine/calibration/screenCalibration';

interface CalibrationState {
  profile: CalibrationProfile;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  setProfile: (profile: CalibrationProfile) => void;
  updatePixelsPerMm: (ppm: number, method: CalibrationProfile['method'], name?: string) => void;
  resetCalibration: () => void;
}

export const useCalibrationStore = create<CalibrationState>((set, get) => ({
  profile: loadSavedCalibration(),
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setProfile: (profile) => {
    saveCalibration(profile);
    set({ profile });
  },
  updatePixelsPerMm: (ppm, method, name) => {
    const updated: CalibrationProfile = {
      id: `calib-${Date.now()}`,
      name: name || `Calibrated via ${method}`,
      dpr: window.devicePixelRatio || 1,
      pixelsPerMm: ppm,
      createdAt: Date.now(),
      isCalibrated: true,
      method,
    };
    saveCalibration(updated);
    set({ profile: updated });
  },
  resetCalibration: () => {
    const defaultProfile: CalibrationProfile = {
      id: 'default-uncalibrated',
      name: 'Default Screen (Uncalibrated ~96 DPI)',
      dpr: window.devicePixelRatio || 1,
      pixelsPerMm: DEFAULT_PIXELS_PER_MM,
      createdAt: Date.now(),
      isCalibrated: false,
      method: 'default',
    };
    saveCalibration(defaultProfile);
    set({ profile: defaultProfile });
  },
}));
