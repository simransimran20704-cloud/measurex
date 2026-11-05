import React, { useState } from 'react';
import { UNIT_CATEGORIES, UNITS, convertValue } from '../../engine/conversion/units';
import { UnitCategory } from '../../types';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import {
  ArrowRightLeft,
  Copy,
  CheckCircle2,
  Sliders,
  Ruler,
  Square,
  Box,
  Weight,
  Compass,
  Thermometer,
  Gauge,
  Clock,
} from 'lucide-react';

export const UnitConverterView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();

  const [category, setCategory] = useState<UnitCategory>('length');
  const [inputValue, setInputValue] = useState<number>(100);
  const [fromUnitId, setFromUnitId] = useState<string>('cm');
  const [toUnitId, setToUnitId] = useState<string>('in');
  const [decimals, setDecimals] = useState<number>(4);

  const availableUnits = UNITS[category];

  // Converted value for main pair
  const convertedValue = convertValue(inputValue, fromUnitId, toUnitId, category);

  // Category Icon map
  const getCategoryIcon = (cat: UnitCategory) => {
    switch (cat) {
      case 'length': return Ruler;
      case 'area': return Square;
      case 'volume': return Box;
      case 'mass': return Weight;
      case 'angle': return Compass;
      case 'temperature': return Thermometer;
      case 'speed': return Gauge;
      case 'time': return Clock;
    }
  };

  const handleSwap = () => {
    setFromUnitId(toUnitId);
    setToUnitId(fromUnitId);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied "${text}" to clipboard!`, 'success');
  };

  const handleLogConversion = () => {
    const fromSymbol = availableUnits.find((u) => u.id === fromUnitId)?.symbol || fromUnitId;
    const toSymbol = availableUnits.find((u) => u.id === toUnitId)?.symbol || toUnitId;
    const summary = `${inputValue} ${fromSymbol} = ${convertedValue.toFixed(decimals)} ${toSymbol}`;

    addItem({
      tool: 'Unit Converter',
      title: `${category.toUpperCase()} Conversion`,
      value: summary,
      rawNumericValue: convertedValue,
      unit: toSymbol,
      details: `Converted from ${fromUnitId} to ${toUnitId}`,
    });
    showToast(`Saved to history: ${summary}`, 'success');
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-12 select-none">
      {/* Category Pills Header */}
      <div className="p-4 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-sm flex items-center gap-2 overflow-x-auto">
        {UNIT_CATEGORIES.map((cat) => {
          const Icon = getCategoryIcon(cat.id);
          const isSelected = category === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id);
                const newUnits = UNITS[cat.id];
                setFromUnitId(newUnits[0].id);
                setToUnitId(newUnits[1]?.id || newUnits[0].id);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white shadow-md shadow-brand-blue/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Conversion Interactive Card */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#DCE5F2] shadow-glass grid grid-cols-1 md:grid-cols-11 gap-4 sm:gap-6 items-center">
        {/* From Input (5 Cols) */}
        <div className="md:col-span-5 flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From Value & Unit</label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
            className="w-full text-2xl font-mono font-extrabold text-[#1D2940] px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-brand-blue"
          />
          <select
            value={fromUnitId}
            onChange={(e) => setFromUnitId(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-100 border border-transparent font-semibold text-xs text-[#1D2940] outline-none"
          >
            {availableUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button (1 Col) */}
        <div className="md:col-span-1 flex justify-center">
          <button
            onClick={handleSwap}
            title="Swap Units"
            className="w-12 h-12 rounded-full bg-[#EEF3FF] border border-[#DCE5F2] text-[#4385E8] hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-sm"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>
        </div>

        {/* To Output (5 Cols) */}
        <div className="md:col-span-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Converted Result</label>
            <button
              onClick={() => handleCopy(convertedValue.toFixed(decimals))}
              className="text-xs font-semibold text-[#4385E8] hover:text-[#8064E8] flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
          <div className="w-full text-2xl font-mono font-extrabold text-[#8064E8] px-4 py-3 rounded-2xl bg-[#F0EDFF] border border-[#E0D8FF] flex items-center justify-between overflow-x-auto">
            <span>{convertedValue.toFixed(decimals)}</span>
            <span className="text-sm font-sans text-slate-500 font-bold ml-2">
              {availableUnits.find((u) => u.id === toUnitId)?.symbol}
            </span>
          </div>
          <select
            value={toUnitId}
            onChange={(e) => setToUnitId(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-100 border border-transparent font-semibold text-xs text-[#1D2940] outline-none"
          >
            {availableUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Controls & Log Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Decimal Precision:</span>
          <select
            value={decimals}
            onChange={(e) => setDecimals(Number(e.target.value))}
            className="text-xs font-bold text-slate-800 bg-slate-100 rounded-lg px-2 py-1 outline-none"
          >
            {[1, 2, 3, 4, 5, 6, 8].map((d) => (
              <option key={d} value={d}>
                {d} decimal places
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleLogConversion}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Save to History</span>
        </button>
      </div>

      {/* Instant All-Units Matrix Table */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-4">
        <h3 className="font-bold text-sm text-[#1D2940]">
          Simultaneous Conversion Matrix ({availableUnits.length} Units in {category})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {availableUnits.map((unitDef) => {
            const val = convertValue(inputValue, fromUnitId, unitDef.id, category);
            return (
              <div
                key={unitDef.id}
                onClick={() => handleCopy(`${val.toFixed(decimals)} ${unitDef.symbol}`)}
                className="group p-3 rounded-xl bg-slate-50/80 hover:bg-[#EEF3FF] border border-slate-100 hover:border-[#DCE5F2] cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-[#4385E8] transition-colors">
                    {unitDef.name}
                  </span>
                  <span className="text-sm font-mono font-extrabold text-[#1D2940] mt-0.5">
                    {val.toFixed(decimals)} {unitDef.symbol}
                  </span>
                </div>
                <Copy className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#4385E8] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
