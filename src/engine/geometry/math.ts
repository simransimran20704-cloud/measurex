import { LengthUnit } from '../../types';
import { convertValue } from '../conversion/units';

export interface Point2D {
  x: number;
  y: number;
}

export function distanceBetween(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleDegrees(p1: Point2D, p2: Point2D): number {
  const dy = p2.y - p1.y;
  const dx = p2.x - p1.x;
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

export function angleBetweenThreePoints(a: Point2D, vertex: Point2D, c: Point2D): number {
  const angleA = Math.atan2(a.y - vertex.y, a.x - vertex.x);
  const angleC = Math.atan2(c.y - vertex.y, c.x - vertex.x);
  let diff = Math.abs(angleA - angleC);
  if (diff > Math.PI) {
    diff = 2 * Math.PI - diff;
  }
  return (diff * 180) / Math.PI;
}

/**
 * Shoelace algorithm for arbitrary polygon area
 */
export function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function polygonPerimeter(points: Point2D[]): number {
  if (points.length < 2) return 0;
  let perim = 0;
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    perim += distanceBetween(points[i], next);
  }
  return perim;
}

/**
 * Convert pixel distance on canvas to target physical length unit
 */
export function pixelsToLength(
  pixels: number,
  targetUnit: LengthUnit,
  pixelsPerMm: number
): number {
  const mm = pixels / pixelsPerMm;
  return convertValue(mm, 'mm', targetUnit, 'length');
}

/**
 * Convert physical length unit to canvas pixels
 */
export function lengthToPixels(
  value: number,
  sourceUnit: LengthUnit,
  pixelsPerMm: number
): number {
  const mm = convertValue(value, sourceUnit, 'mm', 'length');
  return mm * pixelsPerMm;
}
