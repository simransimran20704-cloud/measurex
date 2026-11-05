import React, { useState, useRef, useId } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Copy,
  Info,
  X,
  RefreshCw,
  FileText,
  Layers,
  Check,
} from 'lucide-react';
import {
  parseAndValidateCsv,
  convertToHistoryItems,
  generateSampleCsvTemplate,
  generateErrorReportCsv,
  MAX_CSV_FILE_SIZE_BYTES,
  CsvParseResult,
  CsvParsedRecord,
} from '../../engine/csv/csvParser';
import { useHistoryStore } from '../../stores/historyStore';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (count: number) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { items: existingItems, importItems } = useHistoryStore();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useAppStore();

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'replace'>('skip');
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'invalid' | 'duplicates'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent = generateSampleCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'MeasureX_Measurement_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Sample CSV template downloaded successfully', 'info');
  };

  const handleDownloadErrorReport = () => {
    if (!parseResult || parseResult.invalidRecords.length === 0) return;
    const csvContent = generateErrorReportCsv(parseResult.invalidRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MeasureX_Import_Error_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Error report downloaded', 'info');
  };

  const processFile = (file: File) => {
    // 1. File Type Check
    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
    if (!isCsv) {
      showToast('Invalid file format: Please upload a valid .csv file.', 'warning');
      return;
    }

    // 2. File Size Check (5 MB limit)
    if (file.size > MAX_CSV_FILE_SIZE_BYTES) {
      showToast('File too large: Maximum CSV file size allowed is 5 MB.', 'warning');
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = String(e.target?.result || '');
        const existingIds = new Set(existingItems.map((item) => item.id));
        const result = parseAndValidateCsv(text, existingIds);
        setParseResult(result);

        if (result.validRecords.length === 0 && result.invalidRecords.length > 0) {
          showToast(`CSV parsed: 0 valid records, ${result.invalidRecords.length} invalid records found.`, 'warning');
        } else {
          showToast(`CSV parsed: ${result.validRecords.length} valid records ready to import.`, 'success');
        }
      } catch (err) {
        showToast('Error reading CSV file. Please ensure the file is clean and uncorrupted.', 'warning');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      showToast('Failed to read file from disk.', 'warning');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input value so re-selecting same file triggers onChange
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleExecuteImport = () => {
    if (!parseResult || parseResult.validRecords.length === 0) {
      showToast('No valid records to import.', 'warning');
      return;
    }

    const itemsToImport = convertToHistoryItems(parseResult.validRecords, user?.id);
    const stats = importItems(itemsToImport, duplicateMode);

    showToast(
      `Import complete: ${stats.added} added${stats.replaced > 0 ? `, ${stats.replaced} replaced` : ''}${stats.skipped > 0 ? `, ${stats.skipped} skipped` : ''}.`,
      'success'
    );

    if (onImportComplete) {
      onImportComplete(stats.added + stats.replaced);
    }

    onClose();
  };

  const resetUpload = () => {
    setFileName(null);
    setFileSize(null);
    setParseResult(null);
  };

  // Preview filtering
  const validCount = parseResult?.validRecords.length || 0;
  const invalidCount = parseResult?.invalidRecords.length || 0;
  const duplicateCount = parseResult?.duplicateIds.length || 0;
  const totalCount = parseResult?.totalRows || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-[#DCE5F2] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#DCE5F2] flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-purple-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-[#4385E8] to-[#8064E8] text-white shadow-md shadow-brand-blue/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1D2940]">
                Import Measurements via CSV
              </h2>
              <p className="text-xs text-[#66758D]">
                Upload metrology inspection logs, batch specimen records, or CAD dimensions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* If No File Uploaded: Show Upload Interface */}
          {!parseResult ? (
            <div className="space-y-6">
              {/* Drag and Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all flex flex-col items-center justify-center gap-4 cursor-pointer ${
                  isDragging
                    ? 'border-[#4385E8] bg-blue-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-[#4385E8] bg-[#F8FAFF]/70'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 text-[#4385E8] flex items-center justify-center shadow-inner">
                  <Upload className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <p className="text-base font-bold text-[#1D2940]">
                    Drag and drop your measurement CSV file here
                  </p>
                  <p className="text-xs text-[#66758D]">
                    or click to browse from your computer (maximum file size 5 MB)
                  </p>
                </div>

                <label
                  htmlFor={fileInputId}
                  onClick={(e) => e.stopPropagation()}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white font-bold text-xs shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Browse CSV Files
                </label>

                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,application/vnd.ms-excel"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#66758D] pt-2">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> RFC 4180 Format
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Dimensional, Angular, Mass & Temperature
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Tolerances & Instruments
                  </span>
                </div>
              </div>

              {/* Sample Template & Format Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Download Sample Template */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-100/80 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-[#1D2940] flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-[#4385E8]" />
                      Downloadable Sample CSV Template
                    </h3>
                    <p className="text-[11px] text-[#66758D]">
                      Get a ready-to-use template with sample shafts, calipers, micrometers and tolerances.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-white border border-[#DCE5F2] text-[#4385E8] font-bold text-xs shadow-sm hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>

                {/* Supported Columns Guide */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <span className="font-bold text-slate-800">Supported Columns & Units:</span>
                    <p className="leading-relaxed">
                      <code>measurement_name*</code>, <code>value*</code>, <code>unit*</code>,{' '}
                      <code>category</code>, <code>target_value</code>, <code>lower_tolerance</code>,{' '}
                      <code>upper_tolerance</code>, <code>instrument</code>, <code>measured_by</code>,{' '}
                      <code>measured_at</code>, <code>notes</code>
                    </p>
                    <span className="text-[10px] text-slate-500 block">
                      * Required. Temperature units (<code>°C</code>, <code>°F</code>, <code>K</code>) are supported under category <code>Temperature</code>.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* If File Uploaded: Show Diagnostics & Preview Table */
            <div className="space-y-5">
              {/* File Info Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#4385E8]" />
                  <span className="text-xs font-bold text-slate-800">{fileName}</span>
                  {fileSize && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({(fileSize / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
                <button
                  onClick={resetUpload}
                  className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload Different File</span>
                </button>
              </div>

              {/* Diagnostic Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-medium">Total Rows</span>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{totalCount}</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-xs text-emerald-700 font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                  </span>
                  <p className="text-xl font-black text-emerald-800 mt-0.5">{validCount}</p>
                </div>
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-center">
                  <span className="text-xs text-red-700 font-medium flex items-center justify-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Invalid
                  </span>
                  <p className="text-xl font-black text-red-800 mt-0.5">{invalidCount}</p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-xs text-amber-700 font-medium flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Duplicates
                  </span>
                  <p className="text-xl font-black text-amber-800 mt-0.5">{duplicateCount}</p>
                </div>
              </div>

              {/* Column Mapping Pill List */}
              <div className="p-3 rounded-xl bg-[#F8FAFF] border border-[#DCE5F2]">
                <span className="text-[11px] font-bold text-[#1D2940] block mb-1.5">
                  Detected Column Mappings:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(parseResult.columnMapping).map(([header, mapped]) => (
                    <span
                      key={header}
                      className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700"
                    >
                      <span className="text-slate-400">{header}</span>
                      <span>→</span>
                      <span className="font-bold text-[#4385E8]">{mapped}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Table Filter Tabs & Error Report Action */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'all'
                        ? 'bg-[#4385E8] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All Records ({validCount + invalidCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('valid')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'valid'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Valid Only ({validCount})
                  </button>
                  {invalidCount > 0 && (
                    <button
                      onClick={() => setActiveTab('invalid')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'invalid'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Invalid ({invalidCount})
                    </button>
                  )}
                  {duplicateCount > 0 && (
                    <button
                      onClick={() => setActiveTab('duplicates')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'duplicates'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Duplicates ({duplicateCount})
                    </button>
                  )}
                </div>

                {invalidCount > 0 && (
                  <button
                    onClick={handleDownloadErrorReport}
                    className="px-3 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Error Report ({invalidCount})</span>
                  </button>
                )}
              </div>

              {/* Interactive Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[320px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200 z-10 text-[11px] text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5 pl-4">Row</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Name / Feature</th>
                      <th className="p-2.5">Measurement</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Instrument</th>
                      <th className="p-2.5">Tolerances</th>
                      <th className="p-2.5 pr-4">Details / Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {/* Valid Records */}
                    {(activeTab === 'all' || activeTab === 'valid') &&
                      parseResult.validRecords.map((r) => (
                        <tr key={r.rowNumber} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 pl-4 text-slate-400">#{r.rowNumber}</td>
                          <td className="p-2.5">
                            {r.isExistingDuplicate || r.isDuplicateInFile ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Duplicate
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Valid
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-sans font-bold text-slate-800 truncate max-w-[150px]">
                            {r.measurement_name}
                          </td>
                          <td className="p-2.5 font-bold text-[#4385E8]">
                            {r.value} {r.unit}
                          </td>
                          <td className="p-2.5 font-sans text-slate-600">{r.category}</td>
                          <td className="p-2.5 font-sans text-slate-600">{r.instrument}</td>
                          <td className="p-2.5 text-slate-500 text-[10px]">
                            {r.target_value !== undefined ? (
                              <span>
                                {r.target_value} ±{r.upper_tolerance ?? 0}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="p-2.5 pr-4 text-slate-500 font-sans text-[11px] truncate max-w-[160px]">
                            {r.notes || r.project_name || '—'}
                          </td>
                        </tr>
                      ))}

                    {/* Invalid Records */}
                    {(activeTab === 'all' || activeTab === 'invalid') &&
                      parseResult.invalidRecords.map((inv) => (
                        <tr key={inv.rowNumber} className="bg-red-50/50 hover:bg-red-50 transition-colors">
                          <td className="p-2.5 pl-4 text-red-500 font-bold">#{inv.rowNumber}</td>
                          <td className="p-2.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              Invalid
                            </span>
                          </td>
                          <td className="p-2.5 font-sans font-medium text-slate-700 truncate max-w-[150px]">
                            {inv.rawData.measurement_name || inv.rawData.name || '—'}
                          </td>
                          <td className="p-2.5 font-bold text-red-600">
                            {inv.rawData.value || 'missing'} {inv.rawData.unit || ''}
                          </td>
                          <td className="p-2.5 font-sans text-slate-500">{inv.rawData.category || '—'}</td>
                          <td className="p-2.5 font-sans text-slate-500">{inv.rawData.instrument || '—'}</td>
                          <td className="p-2.5 text-slate-400">—</td>
                          <td className="p-2.5 pr-4 text-red-600 font-sans text-[11px]">
                            {inv.errors.map((e) => e.message).join('; ')}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Duplicate Handling Option */}
              {duplicateCount > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-amber-900">
                        {duplicateCount} duplicate records identified
                      </span>
                      <p className="text-[11px] text-amber-700">
                        Choose how to handle measurements matching existing IDs:
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDuplicateMode('skip')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        duplicateMode === 'skip'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white border border-amber-300 text-amber-900'
                      }`}
                    >
                      Skip Duplicates
                    </button>
                    <button
                      onClick={() => setDuplicateMode('replace')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        duplicateMode === 'replace'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white border border-amber-300 text-amber-900'
                      }`}
                    >
                      Replace Existing
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#DCE5F2] bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            {isAuthenticated ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Logged in as {user?.name} (Records isolated to your account)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Info className="w-3.5 h-3.5" /> Guest session (Imported records saved to local workspace)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
            >
              Cancel
            </button>

            {parseResult && validCount > 0 && (
              <button
                onClick={handleExecuteImport}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white font-bold text-xs shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Import {validCount} Valid Records</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
