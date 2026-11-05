export type UnitCategory = 
  | 'length' 
  | 'area' 
  | 'volume' 
  | 'mass' 
  | 'angle' 
  | 'temperature' 
  | 'speed' 
  | 'time';

export type LengthUnit = 
  | 'nm' 
  | 'µm' 
  | 'mm' 
  | 'cm' 
  | 'm' 
  | 'km' 
  | 'in' 
  | 'ft' 
  | 'yd' 
  | 'mi' 
  | 'pt' 
  | 'pc';

export interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  category: UnitCategory;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}

export interface MeasurementPoint {
  id: string;
  x: number; // in canvas coordinate units
  y: number;
  label: string;
  color?: string;
}

export type ShapeType = 'point' | 'line' | 'rect' | 'circle' | 'angle' | 'polygon' | 'text';

export interface GeometricShape {
  id: string;
  type: ShapeType;
  points: { x: number; y: number }[];
  label?: string;
  color?: string;
  strokeWidth?: number;
  closed?: boolean;
}

export interface CalibrationProfile {
  id: string;
  name: string;
  dpr: number;
  pixelsPerMm: number; // physical pixels per millimeter on screen
  createdAt: number;
  isCalibrated: boolean;
  method: 'credit-card' | 'manual-ruler' | 'coin' | 'default';
}

export interface VernierState {
  mainScaleDiv: number; // usually 1 mm
  numVernierDivisions: number; // usually 10, 20, or 50
  leastCount: number; // mainScaleDiv / numVernierDivisions (e.g. 0.1mm, 0.05mm, 0.02mm)
  zeroError: number; // in mm, positive or negative
  measuredValue: number; // current jaw separation in mm
  unit: 'mm' | 'in';
  mode: 'interactive' | 'digital' | 'manual-test';
  jawType: 'external' | 'internal' | 'depth';
}

export interface ScrewGaugeState {
  pitch: number; // in mm, distance moved in 1 full turn (e.g. 0.5 mm or 1.0 mm)
  circularDivisions: number; // e.g. 50 or 100
  leastCount: number; // pitch / circularDivisions (e.g. 0.01mm or 0.005mm)
  zeroError: number; // in mm
  spindlePosition: number; // displacement in mm (0 to 25mm)
  mode: 'interactive' | 'digital' | 'manual-test';
}

export interface MeasurementHistoryItem {
  id: string;
  tool: string;
  title: string;
  value: string;
  rawNumericValue: number;
  unit: string;
  timestamp: number;
  details?: string;
  userId?: string;
  category?: string;
  projectName?: string;
  targetValue?: number;
  lowerTolerance?: number;
  upperTolerance?: number;
  measuredBy?: string;
  notes?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  type: 'Precision Studio' | 'Instruments' | 'Workspace' | 'Quick Measure';
  lastModified: number;
  description?: string;
  pointsCount?: number;
  data?: any;
  userId?: string;
}
