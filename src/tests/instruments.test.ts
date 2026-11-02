import { describe, it, expect } from 'vitest';
import { computeVernierReading } from '../engine/instruments/vernierMath';
import { computeScrewGaugeReading } from '../engine/instruments/screwGaugeMath';
import { calculatePpm, STANDARD_OBJECTS, DEFAULT_PIXELS_PER_MM } from '../engine/calibration/screenCalibration';

describe('Metrology Instruments & Calibration Engine', () => {
  describe('Vernier Caliper Mechanics', () => {
    it('calculates 10-division vernier reading correctly', () => {
      // 19.4 mm -> MSR = 19mm, VSR = 4 (LC = 0.1 mm)
      const res = computeVernierReading(19.4, 1.0, 10, 0.0);
      expect(res.msr).toBe(19);
      expect(res.vsr).toBe(4);
      expect(res.leastCount).toBe(0.1);
      expect(res.finalReading).toBe(19.4);
      expect(res.coincidenceLineIndex).toBe(4);
    });

    it('calculates 50-division vernier reading correctly (LC = 0.02 mm)', () => {
      // 25.38 mm -> MSR = 25 mm, remainder = 0.38 mm -> VSR = 0.38 / 0.02 = 19
      const res = computeVernierReading(25.38, 1.0, 50, 0.0);
      expect(res.msr).toBe(25);
      expect(res.leastCount).toBe(0.02);
      expect(res.vsr).toBe(19);
      expect(res.finalReading).toBe(25.38);
    });

    it('handles positive zero error correctly with negative zero correction', () => {
      // Zero error +0.2 mm -> jaw separation 15.0 mm appears as 15.2 mm
      // Observed = 15.2 mm, Zero Correction = -0.2 mm, Final = 15.0 mm
      const res = computeVernierReading(15.0, 1.0, 10, 0.2);
      expect(res.zeroError).toBe(0.2);
      expect(res.zeroCorrection).toBe(-0.2);
      expect(res.observedReading).toBe(15.2);
      expect(res.finalReading).toBe(15.0);
    });

    it('handles negative zero error correctly with positive zero correction', () => {
      // Zero error -0.1 mm -> jaw separation 12.0 mm appears as 11.9 mm
      // Observed = 11.9 mm, Zero Correction = +0.1 mm, Final = 12.0 mm
      const res = computeVernierReading(12.0, 1.0, 10, -0.1);
      expect(res.zeroError).toBe(-0.1);
      expect(res.zeroCorrection).toBe(0.1);
      expect(res.finalReading).toBe(12.0);
    });

    it('never produces negative readings when jaws are closed', () => {
      const res = computeVernierReading(-5.0, 1.0, 10, 0.0);
      expect(res.finalReading).toBe(0);
    });
  });

  describe('Micrometer Screw Gauge Mechanics', () => {
    it('calculates standard micrometer reading (0.5mm pitch, 50 circular divs, LC=0.01mm)', () => {
      // Displacement 7.35 mm -> 14 pitch steps (7.0 mm), CSR = 35
      const res = computeScrewGaugeReading(7.35, 0.5, 50, 0.0);
      expect(res.msr).toBe(7.0);
      expect(res.csr).toBe(35);
      expect(res.leastCount).toBe(0.01);
      expect(res.finalReading).toBe(7.35);
    });

    it('calculates high-precision 100-division micrometer (LC=0.005mm)', () => {
      // Displacement 4.245 mm -> MSR = 4.0 mm, remainder 0.245 / 0.005 = 49 divs
      const res = computeScrewGaugeReading(4.245, 0.5, 100, 0.0);
      expect(res.msr).toBe(4.0);
      expect(res.csr).toBe(49);
      expect(res.leastCount).toBe(0.005);
      expect(res.finalReading).toBe(4.245);
    });

    it('computes continuous thimble rotation angle', () => {
      // 0.25 mm with 0.5 mm pitch = half turn = 180 degrees
      const res = computeScrewGaugeReading(0.25, 0.5, 50, 0.0);
      expect(res.rotationAngleDeg).toBeCloseTo(180, 2);
    });

    it('applies micrometer zero error correction convention accurately', () => {
      // Zero error +0.02 mm, displacement 5.00 mm
      // Observed = 5.02 mm, Zero Correction = -0.02 mm, Final = 5.00 mm
      const res = computeScrewGaugeReading(5.00, 0.5, 50, 0.02);
      expect(res.zeroError).toBe(0.02);
      expect(res.zeroCorrection).toBe(-0.02);
      expect(res.finalReading).toBe(5.00);
    });
  });

  describe('Screen Calibration System', () => {
    it('accurately computes screen PPM from standard bank card width', () => {
      const knownCardMm = STANDARD_OBJECTS.creditCard.widthMm; // 85.60 mm
      const measuredPx = 323.5275;
      const ppm = calculatePpm(measuredPx, knownCardMm);
      expect(ppm).toBeCloseTo(DEFAULT_PIXELS_PER_MM, 3);
    });

    it('safely handles non-positive inputs', () => {
      expect(calculatePpm(0, 85.60)).toBe(DEFAULT_PIXELS_PER_MM);
      expect(calculatePpm(323, 0)).toBe(DEFAULT_PIXELS_PER_MM);
    });
  });
});
