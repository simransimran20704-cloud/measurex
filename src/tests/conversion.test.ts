import { describe, it, expect } from 'vitest';
import {
  convertValue,
  convertTemperature,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  celsiusToKelvin,
  kelvinToCelsius,
  fahrenheitToKelvin,
  kelvinToFahrenheit,
  UNITS,
  UNIT_CATEGORIES,
} from '../engine/conversion/units';

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
      expect(convertValue(0, '°C', '°F', 'temperature')).toBeCloseTo(32.0, 3);
      expect(convertValue(0, '°C', 'K', 'temperature')).toBeCloseTo(273.15, 3);
    });

    it('accurately converts 100°C to 212°F', () => {
      expect(convertValue(100, 'c', 'f', 'temperature')).toBeCloseTo(212.0, 3);
      expect(convertValue(100, '°C', '°F', 'temperature')).toBeCloseTo(212.0, 3);
      expect(celsiusToFahrenheit(100)).toBe(212);
      expect(fahrenheitToCelsius(212)).toBe(100);
    });

    it('accurately handles negative temperatures (-40°C = -40°F)', () => {
      expect(convertValue(-40, 'c', 'f', 'temperature')).toBeCloseTo(-40.0, 3);
      expect(celsiusToFahrenheit(-40)).toBe(-40);
      expect(fahrenheitToCelsius(-40)).toBe(-40);
    });

    it('implements all 6 temperature conversions accurately', () => {
      // 1. Celsius to Fahrenheit
      expect(celsiusToFahrenheit(25)).toBe(77);
      expect(convertTemperature(25, '°C', '°F')).toBe(77);

      // 2. Fahrenheit to Celsius
      expect(fahrenheitToCelsius(77)).toBe(25);
      expect(convertTemperature(77, '°F', '°C')).toBe(25);

      // 3. Celsius to Kelvin
      expect(celsiusToKelvin(25)).toBe(298.15);
      expect(convertTemperature(25, '°C', 'K')).toBe(298.15);

      // 4. Kelvin to Celsius
      expect(kelvinToCelsius(298.15)).toBe(25);
      expect(convertTemperature(298.15, 'K', '°C')).toBe(25);

      // 5. Fahrenheit to Kelvin
      expect(fahrenheitToKelvin(77)).toBe(298.15);
      expect(convertTemperature(77, '°F', 'K')).toBe(298.15);

      // 6. Kelvin to Fahrenheit
      expect(kelvinToFahrenheit(298.15)).toBe(77);
      expect(convertTemperature(298.15, 'K', '°F')).toBe(77);
    });

    it('ensures temperature does not use ordinary multiplicative ratio logic', () => {
      // Ordinary ratio logic: 0 * factor = 0 (which is wrong for temperature)
      // Proper affine logic: 0 °C is 32 °F, not 0 °F
      expect(celsiusToFahrenheit(0)).toBe(32);
      expect(convertTemperature(0, '°C', '°F')).toBe(32);
      expect(convertTemperature(0, '°C', 'K')).toBe(273.15);
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
