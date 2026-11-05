import { describe, it, expect, beforeAll } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

import fs from 'fs';
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, val: string) => storageMap.set(key, String(val)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

beforeAll(() => {
  // @ts-ignore
  globalThis.localStorage = localStorageMock;
});

// Import components
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { FooterStatus } from '../components/layout/FooterStatus';
import { DashboardView } from '../modules/dashboard/DashboardView';
import { QuickMeasureView } from '../modules/quick-measure/QuickMeasureView';
import { PrecisionStudioView } from '../modules/precision-studio/PrecisionStudioView';
import { VernierCaliperView } from '../modules/vernier-caliper/VernierCaliperView';
import { ScrewGaugeView } from '../modules/screw-gauge/ScrewGaugeView';
import { UnitConverterView } from '../modules/unit-converter/UnitConverterView';
import { ImageMeasurementView } from '../modules/image-measurement/ImageMeasurementView';
import { VernierHeightGaugeView } from '../modules/scientific-instruments/VernierHeightGaugeView';
import { DigitalProtractorView } from '../modules/scientific-instruments/DigitalProtractorView';
import { DigitalScaleView } from '../modules/scientific-instruments/DigitalScaleView';
import { DigitalCompassView } from '../modules/scientific-instruments/DigitalCompassView';
import { SpiritLevelView } from '../modules/scientific-instruments/SpiritLevelView';
import { DialIndicatorView } from '../modules/scientific-instruments/DialIndicatorView';
import { AuthModal } from '../components/auth/AuthModal';
import { CalibrationModal } from '../modules/calibration/CalibrationModal';
import { SubscriptionModal } from '../modules/subscription/SubscriptionModal';
import { BillingCheckoutModal } from '../modules/subscription/BillingCheckoutModal';
import { DemoModal } from '../modules/dashboard/DemoModal';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useCalibrationStore } from '../stores/calibrationStore';

describe('MeasureX Complete Mobile Responsiveness & Touch Verification Suite', () => {
  describe('1. Mobile Navigation & Drawer Architecture', () => {
    it('renders hamburger menu button visible on mobile (lg:hidden) in Header', () => {
      const html = renderToString(<Header />);
      expect(html).toContain('lg:hidden');
      expect(html).toContain('aria-label');
      // Responsive search bar max-w-sm
      expect(html).toContain('max-w-sm');
    });

    it('renders both desktop sidebar (hidden lg:flex) and mobile drawer (lg:hidden) in Sidebar', () => {
      const html = renderToString(<Sidebar />);
      // Desktop aside has hidden lg:flex
      expect(html).toContain('hidden lg:flex');
      // Mobile off-canvas drawer is present
      expect(html).toContain('Mobile Navigation');
      // Backdrop blur overlay is present
      expect(html).toContain('bg-slate-900/50');
      // All instruments lab submenu items are rendered
      expect(html).toContain('Vernier Caliper');
      expect(html).toContain('Screw Gauge');
      expect(html).toContain('Height Gauge');
      expect(html).toContain('Digital Protractor');
    });

    it('renders responsive footer with flex-col on mobile and md:flex-row on desktop', () => {
      const html = renderToString(<FooterStatus />);
      expect(html).toContain('flex-col md:flex-row');
      expect(html).toContain('px-4 sm:px-6 lg:px-8');
    });
  });

  describe('2. Dashboard Responsiveness', () => {
    it('renders hero section and visual with responsive scaling classes', () => {
      const html = renderToString(<DashboardView />);
      // Hero typography scales down to text-3xl on mobile
      expect(html).toContain('text-3xl sm:text-4xl lg:text-[46px]');
      // Feature cards grid scales from 2 cols on mobile to 6 on desktop
      expect(html).toContain('grid-cols-2 sm:grid-cols-3 lg:grid-cols-6');
      // Bottom 3 columns stack vertically on mobile (grid-cols-1)
      expect(html).toContain('grid-cols-1 md:grid-cols-2 lg:grid-cols-3');
    });
  });

  describe('3. Touch Screen Support in Measurement Instruments', () => {
    it('Quick Measure has touch-none and drag markers with wide tap area', () => {
      const html = renderToString(<QuickMeasureView />);
      // touch-none on interactive ruler container
      expect(html).toContain('touch-none');
      // Markers A and B have 40px width (-ml-5 w-10) for touch targets
      expect(html).toContain('w-10 -ml-5');
    });

    it('Precision Studio has touch-none on canvas and responsive stacking layout', () => {
      const html = renderToString(<PrecisionStudioView />);
      // touch-none on canvas element to prevent scroll capture
      expect(html).toContain('touch-none');
      // Stacks flex-col on mobile and lg:flex-row on desktop
      expect(html).toContain('flex-col lg:flex-row');
      // Results panel spans full width on mobile (w-full lg:w-80)
      expect(html).toContain('w-full lg:w-80');
    });

    it('Vernier Caliper movable jaw has touch-none and fine touch slider', () => {
      const html = renderToString(<VernierCaliperView />);
      // touch-none on movable slider
      expect(html).toContain('cursor-ew-resize group touch-none');
      // Fine slider present for mobile touch
      expect(html).toContain('aria-label="Fine jaw position slider"');
      expect(html).toContain('type="range"');
    });

    it('Screw Gauge micrometer thimble has touch-none and fine touch slider', () => {
      const html = renderToString(<ScrewGaugeView />);
      // touch-none on rotating thimble
      expect(html).toContain('cursor-ns-resize group touch-none');
      // Fine slider present for mobile touch
      expect(html).toContain('aria-label="Fine spindle position slider"');
      expect(html).toContain('type="range"');
    });

    it('Image Measurement Studio has touch-none on interactive drawing canvas', () => {
      const html = renderToString(<ImageMeasurementView />);
      expect(html).toContain('cursor-crosshair touch-none');
    });

    it('Vernier Height Gauge has touch-none and fine touch slider', () => {
      const html = renderToString(<VernierHeightGaugeView />);
      expect(html).toContain('cursor-ns-resize group touch-none');
      expect(html).toContain('aria-label="Fine height adjustment slider"');
    });

    it('Digital Protractor has touch-none and fine angle slider', () => {
      const html = renderToString(<DigitalProtractorView />);
      expect(html).toContain('cursor-crosshair touch-none');
      expect(html).toContain('aria-label="Fine angle adjustment slider"');
    });

    it('Spirit Level has touch-none on 2D tilt simulation pad', () => {
      const html = renderToString(<SpiritLevelView />);
      expect(html).toContain('cursor-crosshair touch-none');
    });
  });

  describe('4. Modals & Dialogs Overflow Prevention', () => {
    it('AuthModal has max-h-[90vh] overflow-y-auto to prevent clipping on mobile screens', () => {
      const src = fs.readFileSync('src/components/auth/AuthModal.tsx', 'utf-8');
      expect(src).toContain('max-h-[90vh]');
      expect(src).toContain('overflow-y-auto');
      expect(src).toContain('p-3 sm:p-4');
    });

    it('CalibrationModal has max-h-[90vh] overflow-y-auto', () => {
      const src = fs.readFileSync('src/modules/calibration/CalibrationModal.tsx', 'utf-8');
      expect(src).toContain('max-h-[90vh]');
      expect(src).toContain('overflow-y-auto');
    });

    it('SubscriptionModal and BillingCheckoutModal are deprecated and return null', () => {
      const subSrc = fs.readFileSync('src/modules/subscription/SubscriptionModal.tsx', 'utf-8');
      expect(subSrc).toContain('return null');
      const billSrc = fs.readFileSync('src/modules/subscription/BillingCheckoutModal.tsx', 'utf-8');
      expect(billSrc).toContain('return null');
    });

    it('DemoModal has max-h-[90vh] overflow-y-auto', () => {
      const src = fs.readFileSync('src/modules/dashboard/DemoModal.tsx', 'utf-8');
      expect(src).toContain('max-h-[90vh]');
      expect(src).toContain('overflow-y-auto');
    });
  });
});
