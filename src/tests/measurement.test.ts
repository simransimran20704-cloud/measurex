import { describe, it, expect } from 'vitest';
import { convertValue } from '../engine/conversion/units';
import { distanceBetween, angleDegrees } from '../engine/geometry/math';
import { computeVernierReading } from '../engine/instruments/vernierMath';
import { computeScrewGaugeReading } from '../engine/instruments/screwGaugeMath';
import { calculatePpm, DEFAULT_PIXELS_PER_MM } from '../engine/calibration/screenCalibration';

describe('Integration Verification Suite', () => {
  it('verifies 2.54 cm converts to 1 inch', () => {
    const cmToIn = convertValue(2.54, 'cm', 'in', 'length');
    expect(cmToIn).toBeCloseTo(1.0, 4);
  });

  it('verifies 3-4-5 Pythagorean triangle distance is 50', () => {
    const dist = distanceBetween({ x: 0, y: 0 }, { x: 30, y: 40 });
    expect(dist).toBe(50);
  });

  it('verifies 45 degree vector angle', () => {
    const angle = angleDegrees({ x: 0, y: 0 }, { x: 10, y: 10 });
    expect(angle).toBeCloseTo(45, 3);
  });

  it('verifies Vernier Caliper calculation at 19.4mm', () => {
    const vernier = computeVernierReading(19.4, 1.0, 10, 0.0);
    expect(vernier.msr).toBe(19);
    expect(vernier.vsr).toBe(4);
    expect(vernier.finalReading).toBe(19.4);
  });

  it('verifies Vernier Caliper zero correction convention', () => {
    const vernierZeroErr = computeVernierReading(10.0, 1.0, 10, 0.1);
    expect(vernierZeroErr.zeroCorrection).toBe(-0.1);
    expect(vernierZeroErr.finalReading).toBeCloseTo(10.0, 2);
  });

  it('verifies Screw Gauge calculation at 7.35mm', () => {
    const gauge = computeScrewGaugeReading(7.35, 0.5, 50, 0.0);
    expect(gauge.msr).toBe(7.0);
    expect(gauge.csr).toBe(35);
    expect(gauge.finalReading).toBe(7.35);
  });

  it('verifies Credit Card calibration PPM ratio', () => {
    const ppm = calculatePpm(323.5275, 85.60);
    expect(ppm).toBeCloseTo(DEFAULT_PIXELS_PER_MM, 2);
  });
});
