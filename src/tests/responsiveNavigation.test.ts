import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../stores/appStore';

describe('MeasureX Responsive Mobile Navigation Suite', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeTab: 'home',
      isMobileMenuOpen: false,
    });
  });

  it('initializes mobile menu in closed state', () => {
    const state = useAppStore.getState();
    expect(state.isMobileMenuOpen).toBe(false);
  });

  it('opens and closes mobile menu drawer via setIsMobileMenuOpen', () => {
    useAppStore.getState().setIsMobileMenuOpen(true);
    expect(useAppStore.getState().isMobileMenuOpen).toBe(true);

    useAppStore.getState().setIsMobileMenuOpen(false);
    expect(useAppStore.getState().isMobileMenuOpen).toBe(false);
  });

  it('toggles mobile menu drawer via toggleMobileMenu', () => {
    expect(useAppStore.getState().isMobileMenuOpen).toBe(false);
    useAppStore.getState().toggleMobileMenu();
    expect(useAppStore.getState().isMobileMenuOpen).toBe(true);
    useAppStore.getState().toggleMobileMenu();
    expect(useAppStore.getState().isMobileMenuOpen).toBe(false);
  });

  it('automatically closes mobile menu drawer upon selecting a navigation tab', () => {
    useAppStore.getState().setIsMobileMenuOpen(true);
    expect(useAppStore.getState().isMobileMenuOpen).toBe(true);

    // Selecting any instrument or tool tab should automatically close the drawer
    useAppStore.getState().setActiveTab('vernier-caliper');
    expect(useAppStore.getState().activeTab).toBe('vernier-caliper');
    expect(useAppStore.getState().isMobileMenuOpen).toBe(false);

    // Select another tool
    useAppStore.getState().setIsMobileMenuOpen(true);
    useAppStore.getState().setActiveTab('precision-studio');
    expect(useAppStore.getState().activeTab).toBe('precision-studio');
    expect(useAppStore.getState().isMobileMenuOpen).toBe(false);
  });

  it('successfully transitions between all mobile-enabled measurement tabs', () => {
    const tabs = [
      'home',
      'quick-measure',
      'precision-studio',
      'vernier-caliper',
      'screw-gauge',
      'scientific-instruments',
      'vernier-height-gauge',
      'dial-indicator',
      'digital-compass',
      'digital-protractor',
      'digital-scale',
      'thread-pitch-gauge',
      'feeler-gauge',
      'spirit-level',
      'pcd-generator',
      'limits-fits',
      'material-estimator',
      'spherometer',
      'metrology-quiz',
      'unit-converter',
      'calibration',
      'projects',
      'history',
      'export',
      'image-measurement',
      'help',
    ] as const;

    for (const tab of tabs) {
      useAppStore.getState().setActiveTab(tab);
      expect(useAppStore.getState().activeTab).toBe(tab);
      expect(useAppStore.getState().isMobileMenuOpen).toBe(false);
    }
  });
});
