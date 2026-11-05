import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseRfc4180Csv,
  normalizeHeader,
  sanitizeCsvFormula,
  parseAndValidateCsv,
  convertToHistoryItems,
  generateSampleCsvTemplate,
  generateErrorReportCsv,
} from '../engine/csv/csvParser';
import { useHistoryStore } from '../stores/historyStore';
import { useAuthStore } from '../stores/authStore';

describe('MeasureX CSV Measurement Import Engine', () => {
  beforeEach(() => {
    useHistoryStore.getState().clearHistory();
    useAuthStore.getState().logout();
  });

  describe('RFC 4180 CSV Parsing', () => {
    it('correctly parses plain comma-separated values', () => {
      const csv = 'name,value,unit\nShaft,25.4,mm\nPin,5.0,mm';
      const rows = parseRfc4180Csv(csv);
      expect(rows).toHaveLength(3);
      expect(rows[0]).toEqual(['name', 'value', 'unit']);
      expect(rows[1]).toEqual(['Shaft', '25.4', 'mm']);
      expect(rows[2]).toEqual(['Pin', '5.0', 'mm']);
    });

    it('handles quoted fields with commas and escaped quotes', () => {
      const csv = 'name,notes\n"Shaft, Grade ""A""",High precision\n"Bracket",Standard';
      const rows = parseRfc4180Csv(csv);
      expect(rows).toHaveLength(3);
      expect(rows[1][0]).toBe('Shaft, Grade "A"');
      expect(rows[1][1]).toBe('High precision');
    });

    it('ignores empty lines and trailing whitespace', () => {
      const csv = 'name,value,unit\n\nShaft,25.4,mm\n\n\n';
      const rows = parseRfc4180Csv(csv);
      expect(rows).toHaveLength(2);
    });
  });

  describe('Security & Formula Injection Sanitization (CWE-1236)', () => {
    it('escapes formulas starting with =, +, -, @, \\t, \\r', () => {
      expect(sanitizeCsvFormula('=1+1')).toBe("'=1+1");
      expect(sanitizeCsvFormula('+cmd|')).toBe("'+cmd|");
      expect(sanitizeCsvFormula('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
      expect(sanitizeCsvFormula('\tcalc')).toBe("'\tcalc");
    });

    it('preserves valid negative numbers', () => {
      expect(sanitizeCsvFormula('-5.25')).toBe('-5.25');
      expect(sanitizeCsvFormula('-100')).toBe('-100');
    });

    it('leaves safe strings unmodified', () => {
      expect(sanitizeCsvFormula('Shaft Diameter')).toBe('Shaft Diameter');
      expect(sanitizeCsvFormula('25.4 mm')).toBe('25.4 mm');
    });
  });

  describe('Header Normalization', () => {
    it('maps diverse header aliases to canonical column names', () => {
      expect(normalizeHeader('Measurement Name')).toBe('measurement_name');
      expect(normalizeHeader('title')).toBe('measurement_name');
      expect(normalizeHeader('DIMENSION')).toBe('measurement_name');
      expect(normalizeHeader('reading')).toBe('value');
      expect(normalizeHeader('val')).toBe('value');
      expect(normalizeHeader('UOM')).toBe('unit');
      expect(normalizeHeader('tool')).toBe('instrument');
      expect(normalizeHeader('operator')).toBe('measured_by');
      expect(normalizeHeader('timestamp')).toBe('measured_at');
    });
  });

  describe('Validation & Parsing Diagnostics', () => {
    it('successfully parses valid records with tolerances and metadata', () => {
      const csv = `measurement_id,measurement_name,value,unit,category,target_value,lower_tolerance,upper_tolerance,instrument,measured_by,notes
M-101,Cylinder Outer Diameter,50.02,mm,Dimensional,50.00,0.01,0.03,Screw Gauge,Simran,Passed inspection
M-102,Chamfer Angle,45.0,deg,Angular,45.0,0.2,0.2,Digital Protractor,Simran,OK`;

      const result = parseAndValidateCsv(csv);
      expect(result.totalRows).toBe(2);
      expect(result.validRecords).toHaveLength(2);
      expect(result.invalidRecords).toHaveLength(0);

      const first = result.validRecords[0];
      expect(first.measurement_id).toBe('M-101');
      expect(first.measurement_name).toBe('Cylinder Outer Diameter');
      expect(first.value).toBe(50.02);
      expect(first.unit).toBe('mm');
      expect(first.category).toBe('Dimensional');
      expect(first.target_value).toBe(50.00);
      expect(first.lower_tolerance).toBe(0.01);
      expect(first.upper_tolerance).toBe(0.03);
      expect(first.instrument).toBe('Screw Gauge');
      expect(first.notes).toBe('Passed inspection');
    });

    it('detects missing measurement_name and flags row as invalid', () => {
      const csv = `measurement_name,value,unit\n,25.4,mm`;
      const result = parseAndValidateCsv(csv);
      expect(result.validRecords).toHaveLength(0);
      expect(result.invalidRecords).toHaveLength(1);
      expect(result.invalidRecords[0].errors[0].field).toBe('measurement_name');
    });

    it('detects non-numeric value and flags row as invalid without silent modification', () => {
      const csv = `measurement_name,value,unit\nShaft,invalid_num,mm`;
      const result = parseAndValidateCsv(csv);
      expect(result.validRecords).toHaveLength(0);
      expect(result.invalidRecords).toHaveLength(1);
      expect(result.invalidRecords[0].errors[0].field).toBe('value');
    });

    it('detects unrecognized unit', () => {
      const csv = `measurement_name,value,unit\nShaft,25.4,alien_unit`;
      const result = parseAndValidateCsv(csv);
      expect(result.validRecords).toHaveLength(0);
      expect(result.invalidRecords).toHaveLength(1);
      expect(result.invalidRecords[0].errors[0].field).toBe('unit');
    });

    it('detects duplicate measurement IDs within the CSV file', () => {
      const csv = `measurement_id,measurement_name,value,unit
M-DUP,Shaft 1,25.4,mm
M-DUP,Shaft 2,30.0,mm`;

      const result = parseAndValidateCsv(csv);
      expect(result.duplicateIds).toContain('M-DUP');
      expect(result.validRecords[1].isDuplicateInFile).toBe(true);
    });

    it('detects duplicate measurement IDs matching existing history', () => {
      const existingIds = new Set(['EXISTING-001']);
      const csv = `measurement_id,measurement_name,value,unit
EXISTING-001,New Reading,42.0,mm`;

      const result = parseAndValidateCsv(csv, existingIds);
      expect(result.duplicateIds).toContain('EXISTING-001');
      expect(result.validRecords[0].isExistingDuplicate).toBe(true);
    });
  });

  describe('Temperature Unit Support & Category Validation (Metrology Rules)', () => {
    it('accepts °C, °F, and K under the Temperature category and preserves original units and values', () => {
      const csv = `measurement_id,category,measurement_name,value,unit,target_value,lower_tolerance,upper_tolerance
T-01,Temperature,Boiling Point,100.0,°C,100.0,0.5,0.5
T-02,Temperature,Oven Temperature,450.0,°F,450.0,2.0,2.0
T-03,Temperature,Cryo Bath,77.3,K,77.0,1.0,1.0`;

      const result = parseAndValidateCsv(csv);
      expect(result.totalRows).toBe(3);
      expect(result.validRecords).toHaveLength(3);
      expect(result.invalidRecords).toHaveLength(0);

      // Verify records preserve original unit and numeric value
      expect(result.validRecords[0].unit).toBe('°C');
      expect(result.validRecords[0].value).toBe(100.0);
      expect(result.validRecords[0].category).toBe('Temperature');

      expect(result.validRecords[1].unit).toBe('°F');
      expect(result.validRecords[1].value).toBe(450.0);
      expect(result.validRecords[1].category).toBe('Temperature');

      expect(result.validRecords[2].unit).toBe('K');
      expect(result.validRecords[2].value).toBe(77.3);
      expect(result.validRecords[2].category).toBe('Temperature');

      // Verify conversion to MeasurementHistoryItem preserves exact units and values
      const items = convertToHistoryItems(result.validRecords);
      expect(items[0].value).toBe('100 °C');
      expect(items[0].rawNumericValue).toBe(100.0);
      expect(items[0].unit).toBe('°C');

      expect(items[1].value).toBe('450 °F');
      expect(items[1].rawNumericValue).toBe(450.0);
      expect(items[1].unit).toBe('°F');

      expect(items[2].value).toBe('77.3 K');
      expect(items[2].rawNumericValue).toBe(77.3);
      expect(items[2].unit).toBe('K');
    });

    it('rejects °C when category is Dimensional or omitted', () => {
      const csv = `category,measurement_name,value,unit
Dimensional,Heated Rod Length,100,°C`;

      const result = parseAndValidateCsv(csv);
      expect(result.validRecords).toHaveLength(0);
      expect(result.invalidRecords).toHaveLength(1);
      expect(result.invalidRecords[0].errors[0].field).toBe('unit');
      expect(result.invalidRecords[0].errors[0].message).toContain('only recognized for the Temperature category');
    });

    it('rejects non-temperature units (e.g. mm, kg) when category is Temperature', () => {
      const csv = `category,measurement_name,value,unit
Temperature,Incompatible Sensor Reading,25.0,mm`;

      const result = parseAndValidateCsv(csv);
      expect(result.validRecords).toHaveLength(0);
      expect(result.invalidRecords).toHaveLength(1);
      expect(result.invalidRecords[0].errors[0].field).toBe('unit');
      expect(result.invalidRecords[0].errors[0].message).toContain('not a valid temperature unit');
    });

    it('rejects invalid or unsupported temperature units under Temperature category', () => {
      const csv = `category,measurement_name,value,unit
Temperature,Bogus Unit Reading,100,°Z`;

      const result = parseAndValidateCsv(csv);
      expect(result.validRecords).toHaveLength(0);
      expect(result.invalidRecords).toHaveLength(1);
      expect(result.invalidRecords[0].errors[0].field).toBe('unit');
    });
  });

  describe('History Store Batch Import Integration', () => {
    it('imports records with mode="skip" preserving existing items', () => {
      const historyStore = useHistoryStore.getState();

      // Seed an existing item
      historyStore.importItems(
        [
          {
            id: 'item-1',
            tool: 'Vernier Caliper',
            title: 'Initial Reading',
            value: '10.0 mm',
            rawNumericValue: 10.0,
            unit: 'mm',
            timestamp: Date.now(),
          },
        ],
        'skip'
      );

      expect(useHistoryStore.getState().items).toHaveLength(1);

      // Attempt to import duplicate with mode="skip"
      const incoming = [
        {
          id: 'item-1',
          tool: 'Vernier Caliper',
          title: 'Modified Reading',
          value: '99.9 mm',
          rawNumericValue: 99.9,
          unit: 'mm',
          timestamp: Date.now(),
        },
        {
          id: 'item-2',
          tool: 'Screw Gauge',
          title: 'Brand New Item',
          value: '5.5 mm',
          rawNumericValue: 5.5,
          unit: 'mm',
          timestamp: Date.now(),
        },
      ];

      const stats = useHistoryStore.getState().importItems(incoming, 'skip');
      expect(stats.added).toBe(1);
      expect(stats.skipped).toBe(1);

      const items = useHistoryStore.getState().items;
      expect(items).toHaveLength(2);
      const original = items.find((i) => i.id === 'item-1');
      expect(original?.title).toBe('Initial Reading'); // preserved
    });

    it('imports records with mode="replace" overwriting matching items', () => {
      const historyStore = useHistoryStore.getState();

      historyStore.importItems(
        [
          {
            id: 'item-1',
            tool: 'Vernier Caliper',
            title: 'Initial Reading',
            value: '10.0 mm',
            rawNumericValue: 10.0,
            unit: 'mm',
            timestamp: Date.now(),
          },
        ],
        'skip'
      );

      const incoming = [
        {
          id: 'item-1',
          tool: 'Vernier Caliper',
          title: 'Overwritten Reading',
          value: '99.9 mm',
          rawNumericValue: 99.9,
          unit: 'mm',
          timestamp: Date.now(),
        },
      ];

      const stats = useHistoryStore.getState().importItems(incoming, 'replace');
      expect(stats.replaced).toBe(1);

      const updated = useHistoryStore.getState().items.find((i) => i.id === 'item-1');
      expect(updated?.title).toBe('Overwritten Reading');
      expect(updated?.rawNumericValue).toBe(99.9);
    });

    it('associates imported records with authenticated user ID', () => {
      // Simulate authenticated user
      useAuthStore.setState({
        user: {
          id: 'usr-simran',
          name: 'Simran Sharma',
          email: 'simran@measurex.io',
          role: 'Lead Metrologist',
          avatar: '',
          plan: 'pro',
          joinedDate: Date.now(),
        },
        isAuthenticated: true,
      });

      const parsed = parseAndValidateCsv('measurement_name,value,unit\nShaft,25.0,mm');
      const items = convertToHistoryItems(parsed.validRecords, 'usr-simran');
      useHistoryStore.getState().importItems(items, 'skip');

      const imported = useHistoryStore.getState().items[0];
      expect(imported.userId).toBe('usr-simran');
    });
  });

  describe('Template & Error Report Generators', () => {
    it('generates a valid RFC 4180 sample CSV template', () => {
      const template = generateSampleCsvTemplate();
      expect(template).toContain('measurement_id,project_name,measurement_name');
      expect(template).toContain('Shaft Manufacturing');
      expect(template).toContain('Screw Gauge');
      const parsed = parseAndValidateCsv(template);
      expect(parsed.validRecords.length).toBeGreaterThan(0);
      expect(parsed.invalidRecords.length).toBe(0);
    });

    it('generates downloadable error report with row numbers and failure reasons', () => {
      const invalidCsv = 'measurement_name,value,unit\n,not_a_number,unknown_unit';
      const result = parseAndValidateCsv(invalidCsv);
      expect(result.invalidRecords.length).toBe(1);

      const errorReport = generateErrorReportCsv(result.invalidRecords);
      expect(errorReport).toContain('Row Number');
      expect(errorReport).toContain('Failed Fields');
      expect(errorReport).toContain('measurement_name');
    });
  });
});
