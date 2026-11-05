import { UnitCategory, UnitDefinition } from '../../types';

export const UNIT_CATEGORIES: { id: UnitCategory; label: string; icon: string }[] = [
  { id: 'length', label: 'Length', icon: 'Ruler' },
  { id: 'area', label: 'Area', icon: 'Square' },
  { id: 'volume', label: 'Volume', icon: 'Box' },
  { id: 'mass', label: 'Mass', icon: 'Weight' },
  { id: 'angle', label: 'Angle', icon: 'Compass' },
  { id: 'temperature', label: 'Temperature', icon: 'Thermometer' },
  { id: 'speed', label: 'Speed', icon: 'Gauge' },
  { id: 'time', label: 'Time', icon: 'Clock' },
];

export const UNITS: Record<UnitCategory, UnitDefinition[]> = {
  length: [
    { id: 'nm', name: 'Nanometer', symbol: 'nm', category: 'length', toBase: (v) => v * 1e-9, fromBase: (v) => v / 1e-9 },
    { id: 'um', name: 'Micrometer', symbol: 'µm', category: 'length', toBase: (v) => v * 1e-6, fromBase: (v) => v / 1e-6 },
    { id: 'mm', name: 'Millimeter', symbol: 'mm', category: 'length', toBase: (v) => v * 1e-3, fromBase: (v) => v / 1e-3 },
    { id: 'cm', name: 'Centimeter', symbol: 'cm', category: 'length', toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
    { id: 'm', name: 'Meter (Base)', symbol: 'm', category: 'length', toBase: (v) => v, fromBase: (v) => v },
    { id: 'km', name: 'Kilometer', symbol: 'km', category: 'length', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: 'in', name: 'Inch', symbol: 'in', category: 'length', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    { id: 'ft', name: 'Foot', symbol: 'ft', category: 'length', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    { id: 'yd', name: 'Yard', symbol: 'yd', category: 'length', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
    { id: 'mi', name: 'Mile', symbol: 'mi', category: 'length', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    { id: 'pt', name: 'Point', symbol: 'pt', category: 'length', toBase: (v) => (v * 0.0254) / 72, fromBase: (v) => (v * 72) / 0.0254 },
    { id: 'pc', name: 'Pica', symbol: 'pc', category: 'length', toBase: (v) => (v * 0.0254) / 6, fromBase: (v) => (v * 6) / 0.0254 },
  ],
  area: [
    { id: 'mm2', name: 'Square Millimeter', symbol: 'mm²', category: 'area', toBase: (v) => v * 1e-6, fromBase: (v) => v / 1e-6 },
    { id: 'cm2', name: 'Square Centimeter', symbol: 'cm²', category: 'area', toBase: (v) => v * 1e-4, fromBase: (v) => v / 1e-4 },
    { id: 'm2', name: 'Square Meter (Base)', symbol: 'm²', category: 'area', toBase: (v) => v, fromBase: (v) => v },
    { id: 'km2', name: 'Square Kilometer', symbol: 'km²', category: 'area', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
    { id: 'in2', name: 'Square Inch', symbol: 'in²', category: 'area', toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
    { id: 'ft2', name: 'Square Foot', symbol: 'ft²', category: 'area', toBase: (v) => v * 0.09290304, fromBase: (v) => v / 0.09290304 },
    { id: 'ac', name: 'Acre', symbol: 'ac', category: 'area', toBase: (v) => v * 4046.8564224, fromBase: (v) => v / 4046.8564224 },
    { id: 'ha', name: 'Hectare', symbol: 'ha', category: 'area', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
  ],
  volume: [
    { id: 'mm3', name: 'Cubic Millimeter', symbol: 'mm³', category: 'volume', toBase: (v) => v * 1e-9, fromBase: (v) => v / 1e-9 },
    { id: 'cm3', name: 'Cubic Centimeter', symbol: 'cm³', category: 'volume', toBase: (v) => v * 1e-6, fromBase: (v) => v / 1e-6 },
    { id: 'm3', name: 'Cubic Meter (Base)', symbol: 'm³', category: 'volume', toBase: (v) => v, fromBase: (v) => v },
    { id: 'ml', name: 'Milliliter', symbol: 'mL', category: 'volume', toBase: (v) => v * 1e-6, fromBase: (v) => v / 1e-6 },
    { id: 'l', name: 'Liter', symbol: 'L', category: 'volume', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
    { id: 'gal', name: 'US Gallon', symbol: 'gal', category: 'volume', toBase: (v) => v * 0.003785411784, fromBase: (v) => v / 0.003785411784 },
  ],
  mass: [
    { id: 'mg', name: 'Milligram', symbol: 'mg', category: 'mass', toBase: (v) => v * 1e-6, fromBase: (v) => v / 1e-6 },
    { id: 'g', name: 'Gram', symbol: 'g', category: 'mass', toBase: (v) => v * 1e-3, fromBase: (v) => v / 1e-3 },
    { id: 'kg', name: 'Kilogram (Base)', symbol: 'kg', category: 'mass', toBase: (v) => v, fromBase: (v) => v },
    { id: 't', name: 'Metric Tonne', symbol: 't', category: 'mass', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: 'oz', name: 'Ounce', symbol: 'oz', category: 'mass', toBase: (v) => v * 0.028349523125, fromBase: (v) => v / 0.028349523125 },
    { id: 'lb', name: 'Pound', symbol: 'lb', category: 'mass', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
  ],
  angle: [
    { id: 'deg', name: 'Degree (Base)', symbol: '°', category: 'angle', toBase: (v) => v, fromBase: (v) => v },
    { id: 'rad', name: 'Radian', symbol: 'rad', category: 'angle', toBase: (v) => (v * 180) / Math.PI, fromBase: (v) => (v * Math.PI) / 180 },
    { id: 'grad', name: 'Gradian', symbol: 'grad', category: 'angle', toBase: (v) => (v * 180) / 200, fromBase: (v) => (v * 200) / 180 },
  ],
  temperature: [
    { id: 'c', name: 'Celsius', symbol: '°C', category: 'temperature', toBase: (v) => v + 273.15, fromBase: (v) => v - 273.15 },
    { id: 'f', name: 'Fahrenheit', symbol: '°F', category: 'temperature', toBase: (v) => ((v - 32) * 5) / 9 + 273.15, fromBase: (v) => ((v - 273.15) * 9) / 5 + 32 },
    { id: 'k', name: 'Kelvin (Base)', symbol: 'K', category: 'temperature', toBase: (v) => v, fromBase: (v) => v },
  ],
  speed: [
    { id: 'mps', name: 'Meters per Second (Base)', symbol: 'm/s', category: 'speed', toBase: (v) => v, fromBase: (v) => v },
    { id: 'kph', name: 'Kilometers per Hour', symbol: 'km/h', category: 'speed', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    { id: 'mph', name: 'Miles per Hour', symbol: 'mph', category: 'speed', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
    { id: 'knot', name: 'Knot', symbol: 'kn', category: 'speed', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
  ],
  time: [
    { id: 'ms', name: 'Millisecond', symbol: 'ms', category: 'time', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
    { id: 's', name: 'Second (Base)', symbol: 's', category: 'time', toBase: (v) => v, fromBase: (v) => v },
    { id: 'min', name: 'Minute', symbol: 'min', category: 'time', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
    { id: 'h', name: 'Hour', symbol: 'h', category: 'time', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    { id: 'day', name: 'Day', symbol: 'day', category: 'time', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
  ],
};

// Dedicated Temperature Conversions (Thermodynamic Affine Equations)
export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

export function celsiusToKelvin(c: number): number {
  return c + 273.15;
}

export function kelvinToCelsius(k: number): number {
  return k - 273.15;
}

export function fahrenheitToKelvin(f: number): number {
  return ((f - 32) * 5) / 9 + 273.15;
}

export function kelvinToFahrenheit(k: number): number {
  return ((k - 273.15) * 9) / 5 + 32;
}

export function normalizeTemperatureUnit(unit: string): '°C' | '°F' | 'K' | null {
  if (!unit) return null;
  const cleaned = unit.trim().toLowerCase().replace(/[\s_\-]+/g, '');
  if (cleaned === '°c' || cleaned === 'c' || cleaned === 'celsius' || cleaned === 'degc') {
    return '°C';
  }
  if (cleaned === '°f' || cleaned === 'f' || cleaned === 'fahrenheit' || cleaned === 'degf') {
    return '°F';
  }
  if (cleaned === 'k' || cleaned === 'kelvin') {
    return 'K';
  }
  return null;
}

export function convertTemperature(value: number, fromUnit: string, toUnit: string): number {
  if (isNaN(value)) return 0;
  const from = normalizeTemperatureUnit(fromUnit);
  const to = normalizeTemperatureUnit(toUnit);
  if (!from || !to) return value;
  if (from === to) return value;

  let converted = value;
  if (from === '°C' && to === '°F') {
    converted = celsiusToFahrenheit(value);
  } else if (from === '°F' && to === '°C') {
    converted = fahrenheitToCelsius(value);
  } else if (from === '°C' && to === 'K') {
    converted = celsiusToKelvin(value);
  } else if (from === 'K' && to === '°C') {
    converted = kelvinToCelsius(value);
  } else if (from === '°F' && to === 'K') {
    converted = fahrenheitToKelvin(value);
  } else if (from === 'K' && to === '°F') {
    converted = kelvinToFahrenheit(value);
  }

  // Eliminate floating point artifacts
  return Math.round(converted * 1e6) / 1e6;
}

export function convertValue(
  value: number,
  fromUnitId: string,
  toUnitId: string,
  category: UnitCategory
): number {
  if (isNaN(value)) return 0;
  if (fromUnitId === toUnitId) return value;

  // Dedicated temperature pipeline ensuring temperature is never processed using multiplicative ratios
  if (category === 'temperature') {
    const fromTemp = normalizeTemperatureUnit(fromUnitId);
    const toTemp = normalizeTemperatureUnit(toUnitId);
    if (fromTemp && toTemp) {
      return convertTemperature(value, fromTemp, toTemp);
    }
  }

  const unitList = UNITS[category];
  if (!unitList) return value;

  const fromUnit = unitList.find((u) => u.id === fromUnitId || u.symbol.toLowerCase() === fromUnitId.toLowerCase());
  const toUnit = unitList.find((u) => u.id === toUnitId || u.symbol.toLowerCase() === toUnitId.toLowerCase());

  if (!fromUnit || !toUnit) return value;

  const baseValue = fromUnit.toBase(value);
  const rawResult = toUnit.fromBase(baseValue);
  // Normalize IEEE-754 floating point artifacts
  return parseFloat(rawResult.toPrecision(12));
}
