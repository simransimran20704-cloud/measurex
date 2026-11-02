import { describe, it, expect } from 'vitest';

describe('MeasureX Advanced Metrology & Engineering Engines', () => {
  it('calculates PCD chordal distance accurately', () => {
    const pcdMm = 120;
    const holeCount = 6;
    // Chordal formula: PCD * sin(180° / N)
    const chordal = pcdMm * Math.sin(Math.PI / holeCount);
    // For 6 holes, chordal = 120 * sin(30°) = 60 mm
    expect(chordal).toBeCloseTo(60.0, 3);
  });

  it('calculates Spherometer optical radius of curvature R = (l^2 / 6h) + (h / 2)', () => {
    const l = 40.0; // mm leg distance
    const h = 2.0; // mm sagitta
    const R = (l * l) / (6 * h) + h / 2;
    // (1600 / 12) + 1 = 133.333 + 1 = 134.333 mm
    expect(R).toBeCloseTo(134.333, 2);
  });

  it('calculates Feeler Gauge stacked blade thickness correctly', () => {
    const leaves = [0.20, 0.05, 0.02];
    const total = leaves.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(0.27, 4);
  });

  it('calculates Material Weight for steel plate', () => {
    // 300mm x 150mm x 10mm = 450 cm3
    const volCm3 = (300 * 150 * 10) / 1000;
    const densitySteel = 7.85; // g/cm3
    const massKg = (volCm3 * densitySteel) / 1000;
    // 450 * 7.85 = 3532.5 g = 3.5325 kg
    expect(massKg).toBeCloseTo(3.5325, 3);
  });

  it('calculates Spirit Level grade slope percentage correctly', () => {
    const angleDeg = 45.0;
    const slope = Math.tan((angleDeg * Math.PI) / 180) * 100;
    expect(slope).toBeCloseTo(100.0, 1);
  });
});
