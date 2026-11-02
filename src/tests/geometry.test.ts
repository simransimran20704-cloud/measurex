import { describe, it, expect } from 'vitest';
import {
  distanceBetween,
  angleDegrees,
  angleBetweenThreePoints,
  polygonArea,
  polygonPerimeter,
  pixelsToLength,
  lengthToPixels,
} from '../engine/geometry/math';

describe('Geometry Engine', () => {
  it('computes Euclidean distance accurately (Pythagorean 3-4-5)', () => {
    const dist = distanceBetween({ x: 0, y: 0 }, { x: 30, y: 40 });
    expect(dist).toBe(50);
  });

  it('computes 2D vector angles in range [0, 360)', () => {
    expect(angleDegrees({ x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(0, 4);
    expect(angleDegrees({ x: 0, y: 0 }, { x: 0, y: 10 })).toBeCloseTo(90, 4);
    expect(angleDegrees({ x: 0, y: 0 }, { x: -10, y: 0 })).toBeCloseTo(180, 4);
    expect(angleDegrees({ x: 0, y: 0 }, { x: 0, y: -10 })).toBeCloseTo(270, 4);
  });

  it('computes angle between three points (90-degree corner)', () => {
    const a = { x: 10, y: 0 };
    const vertex = { x: 0, y: 0 };
    const c = { x: 0, y: 10 };
    expect(angleBetweenThreePoints(a, vertex, c)).toBeCloseTo(90, 4);
  });

  it('computes polygon area with Shoelace formula for a 100x50 rectangle', () => {
    const rectPoints = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ];
    expect(polygonArea(rectPoints)).toBe(5000);
    expect(polygonPerimeter(rectPoints)).toBe(300);
  });

  it('converts canvas pixels to calibrated physical units and back', () => {
    const ppm = 3.7795; // ~96 DPI
    const pixels = 37.795; // 10 mm = 1 cm
    const cm = pixelsToLength(pixels, 'cm', ppm);
    expect(cm).toBeCloseTo(1.0, 3);

    const backPx = lengthToPixels(1.0, 'cm', ppm);
    expect(backPx).toBeCloseTo(pixels, 3);
  });
});
