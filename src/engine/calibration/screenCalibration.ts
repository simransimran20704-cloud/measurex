import { CalibrationProfile } from '../../types';

// Standard fallback: 96 CSS pixels per inch = 96 / 25.4 ≈ 3.779527559 px/mm
export const DEFAULT_PIXELS_PER_MM = 3.779527559;

export const STANDARD_OBJECTS = {
  creditCard: {
    name: 'Standard ID / Credit Card',
    widthMm: 85.60,
    heightMm: 53.98,
    description: 'ISO/IEC 7810 ID-1 (Bank cards, Driving licenses)',
  },
  quarterCoin: {
    name: 'US Quarter ($0.25)',
    diameterMm: 24.26,
    description: 'United States 25-cent coin',
  },
  euroTwoCoin: {
    name: 'Euro (€2) Coin',
    diameterMm: 25.75,
    description: 'European Union 2-Euro coin',
  },
  rupeeTenCoin: {
    name: 'Indian ₹10 Coin',
    diameterMm: 27.00,
    description: 'Reserve Bank of India 10-Rupee coin',
  },
};

const STORAGE_KEY = 'measurex_calibration_profile';

export function loadSavedCalibration(): CalibrationProfile {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Validate devicePixelRatio hasn't drastically changed (e.g. moved from retina to external 1080p monitor)
        const currentDpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
        return {
          ...parsed,
          dpr: currentDpr,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load calibration profile', e);
  }

  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  return {
    id: 'default-uncalibrated',
    name: 'Default Screen (Uncalibrated ~96 DPI)',
    dpr,
    pixelsPerMm: DEFAULT_PIXELS_PER_MM,
    createdAt: Date.now(),
    isCalibrated: false,
    method: 'default',
  };
}

export function saveCalibration(profile: CalibrationProfile): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  } catch (e) {
    console.error('Failed to save calibration', e);
  }
}

/**
 * Given a known physical measurement in mm and the measured on-screen CSS pixels,
 * compute the calibrated pixelsPerMm.
 */
export function calculatePpm(measuredCssPixels: number, knownPhysicalMm: number): number {
  if (knownPhysicalMm <= 0 || measuredCssPixels <= 0) {
    return DEFAULT_PIXELS_PER_MM;
  }
  return measuredCssPixels / knownPhysicalMm;
}
