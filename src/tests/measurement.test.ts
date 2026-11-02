import { convertValue } from '../engine/conversion/units';
import { distanceBetween, angleDegrees, pixelsToLength } from '../engine/geometry/math';
import { computeVernierReading } from '../engine/instruments/vernierMath';
import { computeScrewGaugeReading } from '../engine/instruments/screwGaugeMath';
import { calculatePpm, DEFAULT_PIXELS_PER_MM } from '../engine/calibration/screenCalibration';

export function runAllVerificationTests() {
  const results: { test: string; passed: boolean; details?: string }[] = [];

  // Test 1: Unit Conversion (Metric to Imperial)
  const cmToIn = convertValue(2.54, 'cm', 'in', 'length');
  results.push({
    test: 'Unit Conversion: 2.54 cm -> 1.00 inch',
    passed: Math.abs(cmToIn - 1.0) < 0.0001,
    details: `Got ${cmToIn}`,
  });

  // Test 2: Distance calculation
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 30, y: 40 };
  const dist = distanceBetween(p1, p2);
  results.push({
    test: 'Geometry: 3-4-5 Triangle Distance',
    passed: dist === 50,
    details: `Got ${dist}`,
  });

  // Test 3: Angle calculation
  const angle = angleDegrees({ x: 0, y: 0 }, { x: 10, y: 10 });
  results.push({
    test: 'Geometry: 45 Degree Vector Angle',
    passed: Math.abs(angle - 45) < 0.001,
    details: `Got ${angle}`,
  });

  // Test 4: Vernier Caliper Reading (10 divisions, LC=0.1mm)
  // At 19.4mm, MSR should be 19.0mm, VSR should be 4, LC = 0.1mm
  const vernier = computeVernierReading(19.4, 1.0, 10, 0.0);
  results.push({
    test: 'Vernier: MSR=19mm, VSR=4, Final=19.4mm',
    passed: vernier.msr === 19 && vernier.vsr === 4 && vernier.finalReading === 19.4,
    details: `MSR=${vernier.msr}, VSR=${vernier.vsr}, Final=${vernier.finalReading}`,
  });

  // Test 5: Vernier Zero Correction
  // With positive zero error +0.1mm, apparent position of 10.0mm is 10.1mm, zero correction is -0.1mm, final = 10.0mm
  const vernierZeroErr = computeVernierReading(10.0, 1.0, 10, 0.1);
  results.push({
    test: 'Vernier: Zero Correction Convention',
    passed: vernierZeroErr.zeroCorrection === -0.1 && Math.abs(vernierZeroErr.finalReading - 10.0) < 0.01,
    details: `ZeroCorr=${vernierZeroErr.zeroCorrection}, Final=${vernierZeroErr.finalReading}`,
  });

  // Test 6: Screw Gauge Reading (0.5mm pitch, 50 circular divs, LC=0.01mm)
  // At 7.35mm: 7.35 / 0.5 = 14 full half-mm turns (7.0 mm), remainder 0.35 mm -> 35 divisions
  const gauge = computeScrewGaugeReading(7.35, 0.5, 50, 0.0);
  results.push({
    test: 'Screw Gauge: MSR=7.0mm, CSR=35, Final=7.35mm',
    passed: gauge.msr === 7.0 && gauge.csr === 35 && gauge.finalReading === 7.35,
    details: `MSR=${gauge.msr}, CSR=${gauge.csr}, Final=${gauge.finalReading}`,
  });

  // Test 7: Screen Calibration PPM
  // If 85.60 mm standard card measures 323.52 CSS pixels, PPM = 3.7794 px/mm (~96 DPI)
  const ppm = calculatePpm(323.5275, 85.60);
  results.push({
    test: 'Calibration: Credit Card PPM Calculation',
    passed: Math.abs(ppm - DEFAULT_PIXELS_PER_MM) < 0.01,
    details: `PPM=${ppm.toFixed(4)}`,
  });

  return results;
}
