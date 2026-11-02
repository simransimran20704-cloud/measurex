import { describe, it, expect } from 'vitest';
import { convertValue, UNITS, UNIT_CATEGORIES } from '../engine/conversion/units';

describe('Universal Unit Conversion Engine', () => {
  it('should support all 8 categories', () => {
    expect(UNIT_CATEGORIES.length).toBe(8);
    const categoryIds = UNIT_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain('length');
    expect(categoryIds).toContain('area');
    expect(categoryIds).toContain('volume');
    expect(categoryIds).toContain('mass');
    expect(categoryIds).toContain('angle');
    expect(categoryIds).toContain('temperature');
    expect(categoryIds).toContain('speed');
    expect(categoryIds).toContain('time');
  });

  describe('Length Conversions', () => {
    it('accurately converts 2.54 cm to 1.00 inch', () => {
      const result = convertValue(2.54, 'cm', 'in', 'length');
      expect(result).toBeCloseTo(1.0, 4);
    });

    it('accurately converts 1 meter to millimeters, nanometers, and feet', () => {
      expect(convertValue(1, 'm', 'mm', 'length')).toBe(1000);
      expect(convertValue(1, 'm', 'nm', 'length')).toBe(1e9);
      expect(convertValue(1, 'm', 'ft', 'length')).toBeCloseTo(3.28084, 4);
    });

    it('handles identical from and to unit without precision loss', () => {
      expect(convertValue(42.195, 'km', 'km', 'length')).toBe(42.195);
    });
  });

  describe('Area & Volume Conversions', () => {
    it('accurately converts 1 square meter to square centimeters and square feet', () => {
      expect(convertValue(1, 'm2', 'cm2', 'area')).toBe(10000);
      expect(convertValue(1, 'm2', 'ft2', 'area')).toBeCloseTo(10.7639, 3);
    });

    it('accurately converts 1 liter to cubic centimeters and milliliters', () => {
      expect(convertValue(1, 'l', 'cm3', 'volume')).toBe(1000);
      expect(convertValue(1, 'l', 'ml', 'volume')).toBe(1000);
    });
  });

  describe('Temperature Conversions (Affine offsets)', () => {
    it('accurately converts 0°C to 32°F and 273.15K', () => {
      expect(convertValue(0, 'c', 'f', 'temperature')).toBeCloseTo(32.0, 3);
      expect(convertValue(0, 'c', 'k', 'temperature')).toBeCloseTo(273.15, 3);
    });

    it('accurately converts 100°C to 212°F', () => {
      expect(convertValue(100, 'c', 'f', 'temperature')).toBeCloseTo(212.0, 3);
    });

    it('accurately handles negative temperatures (-40°C = -40°F)', () => {
      expect(convertValue(-40, 'c', 'f', 'temperature')).toBeCloseTo(-40.0, 3);
    });
  });

  describe('Speed, Mass, and Time', () => {
    it('accurately converts 36 km/h to 10 m/s', () => {
      expect(convertValue(36, 'kph', 'mps', 'speed')).toBeCloseTo(10.0, 4);
    });

    it('accurately converts 1 kg to pounds (2.20462 lb)', () => {
      expect(convertValue(1, 'kg', 'lb', 'mass')).toBeCloseTo(2.20462, 4);
    });

    it('accurately converts 1 hour to 3600 seconds', () => {
      expect(convertValue(1, 'h', 's', 'time')).toBe(3600);
    });
  });
});
