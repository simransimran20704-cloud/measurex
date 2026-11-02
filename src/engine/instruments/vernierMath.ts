export interface VernierCalculation {
  msr: number; // Main scale reading in mm
  vsr: number; // Vernier scale reading (division index)
  leastCount: number; // in mm (e.g. 0.1 mm, 0.05 mm, 0.02 mm)
  zeroError: number; // in mm
  zeroCorrection: number; // -zeroError
  observedReading: number; // msr + vsr * lc
  finalReading: number; // observedReading + zeroCorrection
  coincidenceLineIndex: number;
}

export function computeVernierReading(
  jawDisplacementMm: number,
  mainScaleDivMm: number = 1.0,
  numVernierDivisions: number = 10,
  zeroErrorMm: number = 0.0
): VernierCalculation {
  // Least count = Value of 1 Main Scale Division / Number of Vernier Divisions
  // e.g. 1 mm / 10 = 0.1 mm, or 1 mm / 50 = 0.02 mm
  const leastCount = mainScaleDivMm / numVernierDivisions;

  // The actual position measured by the caliper considering zero error
  const actualJawSeparation = Math.max(0, jawDisplacementMm);
  const apparentPosition = actualJawSeparation + zeroErrorMm;

  // Main Scale Reading (MSR) is the floor of apparent position in mainScaleDivMm increments
  const msrUnits = Math.floor(apparentPosition / mainScaleDivMm);
  const msr = msrUnits * mainScaleDivMm;

  // Remainder fraction that must be measured by vernier scale
  const remainder = apparentPosition - msr;
  
  // Vernier Scale Reading (VSR) is which mark coincides best
  let vsr = Math.round(remainder / leastCount);
  if (vsr >= numVernierDivisions) {
    vsr = numVernierDivisions - 1;
  }
  if (vsr < 0) vsr = 0;

  const observedReading = Number((msr + vsr * leastCount).toFixed(4));
  const zeroCorrection = -zeroErrorMm;
  const finalReading = Number((observedReading + zeroCorrection).toFixed(4));

  return {
    msr,
    vsr,
    leastCount,
    zeroError: zeroErrorMm,
    zeroCorrection,
    observedReading,
    finalReading: Math.max(0, finalReading),
    coincidenceLineIndex: vsr,
  };
}
