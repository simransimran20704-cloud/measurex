import { MeasurementHistoryItem } from '../../types';

export interface CsvRawRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface CsvParsedRecord {
  rowNumber: number;
  measurement_id: string;
  project_name?: string;
  measurement_name: string;
  category: string;
  value: number;
  unit: string;
  target_value?: number;
  lower_tolerance?: number;
  upper_tolerance?: number;
  instrument: string;
  measured_by?: string;
  measured_at: number;
  notes?: string;
  isDuplicateInFile?: boolean;
  isExistingDuplicate?: boolean;
}

export interface CsvRowError {
  rowNumber: number;
  field: string;
  message: string;
  rawValue?: string;
}

export interface CsvParseResult {
  totalRows: number;
  validRecords: CsvParsedRecord[];
  invalidRecords: { rowNumber: number; rawData: Record<string, string>; errors: CsvRowError[] }[];
  duplicateIds: string[];
  columnMapping: Record<string, string>;
  headers: string[];
}

// Supported standard metrology units
export const VALID_UNITS = new Set([
  // Length
  'mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi', 'nm', 'um', 'µm', 'mil', 'px',
  // Angle
  'deg', '°', 'rad', 'grad', 'arcmin', 'arcsec',
  // Mass
  'mg', 'g', 'kg', 'oz', 'lb', 'ton',
  // Area
  'mm²', 'cm²', 'm²', 'in²', 'ft²', 'mm2', 'cm2', 'm2', 'in2', 'ft2',
  // Volume
  'mm³', 'cm³', 'm³', 'in³', 'l', 'ml', 'mm3', 'cm3', 'm3', 'in3',
]);

// Standard categories
export const VALID_CATEGORIES = [
  'Dimensional',
  'Angular',
  'Mass & Weight',
  'Area & Volume',
  'Temperature',
  'Calibration',
  'Workshop Inspection',
  'Quality Control',
  'General',
];

// Supported temperature units (exclusive to the Temperature category)
export const VALID_TEMPERATURE_UNITS = new Set([
  '°c', '°C', 'c', 'C', 'celsius', 'degc', 'deg c', '° c',
  '°f', '°F', 'f', 'F', 'fahrenheit', 'degf', 'deg f', '° f',
  'k', 'K', 'kelvin',
]);

/**
 * Checks whether a given category string represents Temperature
 */
export function isTemperatureCategory(category?: string): boolean {
  if (!category) return false;
  const cat = category.trim().toLowerCase().replace(/[\s_\-]+/g, '');
  return cat === 'temperature' || cat === 'temp' || cat === 'thermal';
}

/**
 * Checks whether a given unit string represents a Temperature unit (°C, °F, K, etc.)
 */
export function isTemperatureUnit(unit?: string): boolean {
  if (!unit) return false;
  const cleaned = unit.trim().toLowerCase().replace(/[\s_\-]+/g, '');
  return (
    cleaned === '°c' ||
    cleaned === 'c' ||
    cleaned === 'celsius' ||
    cleaned === 'degc' ||
    cleaned === '°f' ||
    cleaned === 'f' ||
    cleaned === 'fahrenheit' ||
    cleaned === 'degf' ||
    cleaned === 'k' ||
    cleaned === 'kelvin'
  );
}

// Maximum allowed CSV upload size (5 MB)
export const MAX_CSV_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_CSV_ROWS = 5000;

/**
 * Formula injection defense (CWE-1236)
 * Neutralizes Excel/Calc formula prefixes (=, +, -, @, \t, \r)
 */
export function sanitizeCsvFormula(value: string): string {
  if (typeof value !== 'string') return String(value || '');
  if (/^[\t\r]/.test(value)) {
    return `'${value}`;
  }
  const trimmed = value.trim();
  if (/^[=+\-@]/.test(trimmed)) {
    // If it's a negative number like -5.2, keep it if it is purely numeric
    if (/^-\d+(\.\d+)?$/.test(trimmed)) {
      return trimmed;
    }
    // Otherwise neutralize formula injection by prepending an apostrophe
    return `'${trimmed}`;
  }
  return value;
}

/**
 * RFC 4180 compliant CSV parser
 * Handles quoted fields, inner escaped quotes (""), and commas inside quotes.
 */
export function parseRfc4180Csv(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  // Normalize line endings
  const cleanedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < cleanedText.length; i++) {
    const char = cleanedText[i];
    const nextChar = cleanedText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double quote
          currentField += '"';
          i++;
        } else {
          // Closing quote
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        // Only push row if not completely empty line
        if (currentRow.some((field) => field.trim().length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push final field and row
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((field) => field.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Standardizes header names to canonical field names
 */
export function normalizeHeader(rawHeader: string): string {
  const cleaned = rawHeader.toLowerCase().trim().replace(/[\s\-_]+/g, '_');
  const mapping: Record<string, string> = {
    measurement_id: 'measurement_id',
    id: 'measurement_id',
    meas_id: 'measurement_id',
    item_id: 'measurement_id',

    project_name: 'project_name',
    project: 'project_name',
    project_title: 'project_name',

    measurement_name: 'measurement_name',
    name: 'measurement_name',
    title: 'measurement_name',
    dimension: 'measurement_name',
    feature: 'measurement_name',

    category: 'category',
    type: 'category',
    group: 'category',

    value: 'value',
    val: 'value',
    reading: 'value',
    measured_value: 'value',
    dimension_value: 'value',

    unit: 'unit',
    units: 'unit',
    uom: 'unit',

    target_value: 'target_value',
    target: 'target_value',
    nominal: 'target_value',
    nominal_value: 'target_value',

    lower_tolerance: 'lower_tolerance',
    lower_tol: 'lower_tolerance',
    min_tolerance: 'lower_tolerance',
    tolerance_lower: 'lower_tolerance',

    upper_tolerance: 'upper_tolerance',
    upper_tol: 'upper_tolerance',
    max_tolerance: 'upper_tolerance',
    tolerance_upper: 'upper_tolerance',

    instrument: 'instrument',
    tool: 'instrument',
    equipment: 'instrument',
    device: 'instrument',

    measured_by: 'measured_by',
    operator: 'measured_by',
    inspector: 'measured_by',
    user: 'measured_by',
    author: 'measured_by',

    measured_at: 'measured_at',
    timestamp: 'measured_at',
    date: 'measured_at',
    time: 'measured_at',
    datetime: 'measured_at',

    notes: 'notes',
    note: 'notes',
    comment: 'notes',
    comments: 'notes',
    remarks: 'notes',
    description: 'notes',
  };

  return mapping[cleaned] || cleaned;
}

/**
 * Parse and validate a CSV string with diagnostics and duplicate detection
 */
export function parseAndValidateCsv(
  csvText: string,
  existingIds: Set<string> = new Set()
): CsvParseResult {
  const parsedRows = parseRfc4180Csv(csvText);

  if (parsedRows.length === 0) {
    return {
      totalRows: 0,
      validRecords: [],
      invalidRecords: [],
      duplicateIds: [],
      columnMapping: {},
      headers: [],
    };
  }

  const rawHeaders = parsedRows[0];
  const headers = rawHeaders.map((h) => h.trim());
  const columnMapping: Record<string, string> = {};

  headers.forEach((h) => {
    columnMapping[h] = normalizeHeader(h);
  });

  const dataRows = parsedRows.slice(1);
  const validRecords: CsvParsedRecord[] = [];
  const invalidRecords: { rowNumber: number; rawData: Record<string, string>; errors: CsvRowError[] }[] = [];
  const seenIdsInFile = new Set<string>();
  const duplicateIds: string[] = [];

  const rowLimit = Math.min(dataRows.length, MAX_CSV_ROWS);

  for (let idx = 0; idx < rowLimit; idx++) {
    const rowNumber = idx + 2; // 1-indexed, header is row 1
    const rowValues = dataRows[idx];
    const rawData: Record<string, string> = {};
    const normalizedData: Record<string, string> = {};

    headers.forEach((header, colIdx) => {
      const val = (rowValues[colIdx] || '').trim();
      rawData[header] = val;
      const canonicalKey = columnMapping[header];
      if (canonicalKey) {
        normalizedData[canonicalKey] = val;
      }
    });

    const rowErrors: CsvRowError[] = [];

    // Category determination
    const rawCategory = (normalizedData.category || '').trim();
    const isTempCategory = isTemperatureCategory(rawCategory);
    const resolvedCategory = isTempCategory
      ? 'Temperature'
      : sanitizeCsvFormula(normalizedData.category || 'Dimensional');

    // 1. Validate measurement_name (Required)
    const measurementName = sanitizeCsvFormula(normalizedData.measurement_name || '');
    if (!measurementName) {
      rowErrors.push({
        rowNumber,
        field: 'measurement_name',
        message: 'Measurement name is required and cannot be empty.',
        rawValue: normalizedData.measurement_name,
      });
    }

    // 2. Validate value (Required Numeric)
    const rawValStr = normalizedData.value;
    let numericValue = NaN;
    if (rawValStr === undefined || rawValStr === '') {
      rowErrors.push({
        rowNumber,
        field: 'value',
        message: 'Measurement value is required.',
        rawValue: rawValStr,
      });
    } else {
      // Remove any trailing commas or spaces
      numericValue = Number(rawValStr);
      if (isNaN(numericValue) || !isFinite(numericValue)) {
        rowErrors.push({
          rowNumber,
          field: 'value',
          message: `Measurement value '${rawValStr}' is not a valid number.`,
          rawValue: rawValStr,
        });
      }
    }

    // 3. Validate unit (Required)
    // Enforce temperature units (°C, °F, K) exclusively for the Temperature category
    const rawUnit = (normalizedData.unit || '').trim();
    if (!rawUnit) {
      rowErrors.push({
        rowNumber,
        field: 'unit',
        message: 'Measurement unit is required (e.g. mm, cm, in, deg, g, °C).',
        rawValue: rawUnit,
      });
    } else if (isTempCategory) {
      if (!isTemperatureUnit(rawUnit)) {
        rowErrors.push({
          rowNumber,
          field: 'unit',
          message: `Unit '${rawUnit}' is not a valid temperature unit. Supported temperature units for the Temperature category are °C, °F, and K.`,
          rawValue: rawUnit,
        });
      }
    } else {
      if (isTemperatureUnit(rawUnit)) {
        rowErrors.push({
          rowNumber,
          field: 'unit',
          message: `Temperature unit '${rawUnit}' is only recognized for the Temperature category. Please set category to 'Temperature'.`,
          rawValue: rawUnit,
        });
      } else {
        const lowerUnit = rawUnit.toLowerCase();
        if (!VALID_UNITS.has(lowerUnit) && !VALID_UNITS.has(rawUnit)) {
          rowErrors.push({
            rowNumber,
            field: 'unit',
            message: `Unrecognized measurement unit '${rawUnit}'. Supported units include mm, cm, m, in, ft, deg, rad, g, kg.`,
            rawValue: rawUnit,
          });
        }
      }
    }

    // 4. Validate target_value & tolerances (Optional Numeric)
    let targetValue: number | undefined = undefined;
    if (normalizedData.target_value && normalizedData.target_value.length > 0) {
      const num = Number(normalizedData.target_value);
      if (isNaN(num) || !isFinite(num)) {
        rowErrors.push({
          rowNumber,
          field: 'target_value',
          message: `Target value '${normalizedData.target_value}' must be numeric.`,
          rawValue: normalizedData.target_value,
        });
      } else {
        targetValue = num;
      }
    }

    let lowerTol: number | undefined = undefined;
    if (normalizedData.lower_tolerance && normalizedData.lower_tolerance.length > 0) {
      const num = Number(normalizedData.lower_tolerance);
      if (isNaN(num) || !isFinite(num)) {
        rowErrors.push({
          rowNumber,
          field: 'lower_tolerance',
          message: `Lower tolerance '${normalizedData.lower_tolerance}' must be numeric.`,
          rawValue: normalizedData.lower_tolerance,
        });
      } else {
        lowerTol = num;
      }
    }

    let upperTol: number | undefined = undefined;
    if (normalizedData.upper_tolerance && normalizedData.upper_tolerance.length > 0) {
      const num = Number(normalizedData.upper_tolerance);
      if (isNaN(num) || !isFinite(num)) {
        rowErrors.push({
          rowNumber,
          field: 'upper_tolerance',
          message: `Upper tolerance '${normalizedData.upper_tolerance}' must be numeric.`,
          rawValue: normalizedData.upper_tolerance,
        });
      } else {
        upperTol = num;
      }
    }

    // 5. Validate date/timestamp
    let measuredAtTime = Date.now();
    if (normalizedData.measured_at && normalizedData.measured_at.length > 0) {
      const dateStr = normalizedData.measured_at;
      const parsedTime = Date.parse(dateStr);
      if (isNaN(parsedTime)) {
        // Check if it's numeric timestamp in ms
        const numericMs = Number(dateStr);
        if (!isNaN(numericMs) && numericMs > 0) {
          measuredAtTime = numericMs;
        } else {
          rowErrors.push({
            rowNumber,
            field: 'measured_at',
            message: `Invalid date format '${dateStr}'. Use ISO format (YYYY-MM-DD or YYYY-MM-DD HH:mm).`,
            rawValue: dateStr,
          });
        }
      } else {
        measuredAtTime = parsedTime;
      }
    }

    // 6. Measurement ID & Duplicates
    let measId = normalizedData.measurement_id || '';
    if (!measId) {
      measId = `meas-csv-${Date.now()}-${idx + 1}`;
    }

    let isDuplicateInFile = false;
    let isExistingDuplicate = false;

    if (seenIdsInFile.has(measId)) {
      isDuplicateInFile = true;
      duplicateIds.push(measId);
    } else {
      seenIdsInFile.add(measId);
    }

    if (existingIds.has(measId)) {
      isExistingDuplicate = true;
      duplicateIds.push(measId);
    }

    if (rowErrors.length > 0) {
      invalidRecords.push({
        rowNumber,
        rawData,
        errors: rowErrors,
      });
    } else {
      validRecords.push({
        rowNumber,
        measurement_id: measId,
        project_name: sanitizeCsvFormula(normalizedData.project_name || ''),
        measurement_name: measurementName,
        category: resolvedCategory,
        value: numericValue,
        unit: rawUnit,
        target_value: targetValue,
        lower_tolerance: lowerTol,
        upper_tolerance: upperTol,
        instrument: sanitizeCsvFormula(normalizedData.instrument || 'Precision Studio'),
        measured_by: sanitizeCsvFormula(normalizedData.measured_by || ''),
        measured_at: measuredAtTime,
        notes: sanitizeCsvFormula(normalizedData.notes || ''),
        isDuplicateInFile,
        isExistingDuplicate,
      });
    }
  }

  return {
    totalRows: dataRows.length,
    validRecords,
    invalidRecords,
    duplicateIds: Array.from(new Set(duplicateIds)),
    columnMapping,
    headers,
  };
}

/**
 * Transforms validated CSV records into MeasureX MeasurementHistoryItems
 */
export function convertToHistoryItems(
  records: CsvParsedRecord[],
  userId?: string
): MeasurementHistoryItem[] {
  return records.map((r) => {
    let details = `Imported from CSV (${r.category})`;
    if (r.target_value !== undefined) {
      const tolStr = `Nominal: ${r.target_value} ${r.unit}` +
        (r.lower_tolerance !== undefined ? ` -${Math.abs(r.lower_tolerance)}` : '') +
        (r.upper_tolerance !== undefined ? ` +${Math.abs(r.upper_tolerance)}` : '');
      details += ` • ${tolStr}`;
    }
    if (r.notes) {
      details += ` • Note: ${r.notes}`;
    }

    return {
      id: r.measurement_id,
      tool: r.instrument || 'CSV Import',
      title: r.measurement_name,
      value: `${r.value} ${r.unit}`,
      rawNumericValue: r.value,
      unit: r.unit,
      timestamp: r.measured_at,
      details,
      userId,
      category: r.category,
      projectName: r.project_name,
      targetValue: r.target_value,
      lowerTolerance: r.lower_tolerance,
      upperTolerance: r.upper_tolerance,
      measuredBy: r.measured_by,
      notes: r.notes,
    };
  });
}

/**
 * Generates an official downloadable CSV sample template with reference rows
 */
export function generateSampleCsvTemplate(): string {
  const headers = [
    'measurement_id',
    'project_name',
    'measurement_name',
    'category',
    'value',
    'unit',
    'target_value',
    'lower_tolerance',
    'upper_tolerance',
    'instrument',
    'measured_by',
    'measured_at',
    'notes',
  ];

  const sampleRows = [
    [
      'MEAS-001',
      'Shaft Manufacturing',
      'Main Shaft Outer Diameter',
      'Dimensional',
      '25.04',
      'mm',
      '25.00',
      '0.02',
      '0.05',
      'Screw Gauge',
      'Simran S.',
      new Date().toISOString().slice(0, 16).replace('T', ' '),
      'Within grade IT7 tolerance band',
    ],
    [
      'MEAS-002',
      'Shaft Manufacturing',
      'Keyway Width',
      'Dimensional',
      '8.02',
      'mm',
      '8.00',
      '0.00',
      '0.03',
      'Vernier Caliper',
      'Simran S.',
      new Date().toISOString().slice(0, 16).replace('T', ' '),
      'Verified with calibrated knife-edge jaws',
    ],
    [
      'MEAS-003',
      'Aerospace Bracket',
      'Flange Chamfer Angle',
      'Angular',
      '45.2',
      'deg',
      '45.0',
      '0.5',
      '0.5',
      'Digital Protractor',
      'Lead Metrologist',
      new Date().toISOString().slice(0, 16).replace('T', ' '),
      'Clean surface finish, zero burrs',
    ],
    [
      'MEAS-004',
      'Aerospace Bracket',
      'Specimen Net Mass',
      'Mass & Weight',
      '342.85',
      'g',
      '340.0',
      '5.0',
      '5.0',
      'Precision Scale',
      'QC Inspector',
      new Date().toISOString().slice(0, 16).replace('T', ' '),
      'Gravimetric verification complete',
    ],
    [
      'MEAS-005',
      'Thermal Processing Lab',
      'Furnace Soaking Zone Temp',
      'Temperature',
      '850.5',
      '°C',
      '850.0',
      '5.0',
      '5.0',
      'Digital Pyrometer',
      'QC Inspector',
      new Date().toISOString().slice(0, 16).replace('T', ' '),
      'Steady-state thermal soaking verified within tolerance',
    ],
  ];

  const lines = [
    headers.join(','),
    ...sampleRows.map((row) =>
      row
        .map((cell) => {
          const s = String(cell);
          if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(',')
    ),
  ];

  return lines.join('\n');
}

/**
 * Generates a downloadable CSV error report for invalid rows
 */
export function generateErrorReportCsv(
  invalidRecords: { rowNumber: number; rawData: Record<string, string>; errors: CsvRowError[] }[]
): string {
  const headers = ['Row Number', 'Failed Fields', 'Error Details', 'Submitted Data'];

  const rows = invalidRecords.map((r) => {
    const fields = r.errors.map((e) => e.field).join('; ');
    const messages = r.errors.map((e) => `[${e.field}] ${e.message}`).join(' | ');
    const rawDataStr = JSON.stringify(r.rawData).replace(/"/g, '""');

    return [r.rowNumber, `"${fields}"`, `"${messages}"`, `"${rawDataStr}"`].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
