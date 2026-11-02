export interface ScrewGaugeCalculation {
  msr: number; // Main scale (sleeve) reading in mm
  csr: number; // Circular scale reading (division mark 0 to circularDivs - 1)
  pitch: number; // in mm
  circularDivisions: number;
  leastCount: number; // in mm
  zeroError: number; // in mm
  zeroCorrection: number; // in mm (-zeroError)
  observedReading: number; // msr + (csr * lc)
  finalReading: number; // observedReading + zeroCorrection
  rotationAngleDeg: number; // continuous rotation angle in degrees
}

export function computeScrewGaugeReading(
  spindleDisplacementMm: number,
  pitchMm: number = 0.5,
  circularDivisions: number = 50,
  zeroErrorMm: number = 0.0
): ScrewGaugeCalculation {
  const leastCount = pitchMm / circularDivisions;
  const clampedDisplacement = Math.max(0, spindleDisplacementMm);
  const apparentPosition = clampedDisplacement + zeroErrorMm;

  // Number of full pitch steps uncovered on the sleeve
  // Note: On standard 0.5mm pitch micrometers, there are upper marks (1mm) and lower marks (0.5mm intervals)
  const pitchSteps = Math.floor(apparentPosition / pitchMm);
  const msr = Number((pitchSteps * pitchMm).toFixed(4));

  const remainder = apparentPosition - msr;
  let csr = Math.round(remainder / leastCount) % circularDivisions;
  if (csr < 0) csr += circularDivisions;

  const observedReading = Number((msr + csr * leastCount).toFixed(4));
  const zeroCorrection = -zeroErrorMm;
  const finalReading = Number((observedReading + zeroCorrection).toFixed(4));

  // 1 full turn (360 deg) = 1 pitch
  const totalTurns = apparentPosition / pitchMm;
  const rotationAngleDeg = (totalTurns * 360) % 360;

  return {
    msr,
    csr,
    pitch: pitchMm,
    circularDivisions,
    leastCount,
    zeroError: zeroErrorMm,
    zeroCorrection,
    observedReading,
    finalReading: Math.max(0, finalReading),
    rotationAngleDeg,
  };
}
