import React, { useState } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import {
  Clock,
  Trash2,
  Copy,
  Download,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { items, removeItem, clearHistory } = useHistoryStore();
  const { showToast, setActiveTab } = useAppStore();

  const [filterTool, setFilterTool] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filteredItems = items.filter((item) => {
    const matchesTool = filterTool === 'all' || item.tool.toLowerCase().includes(filterTool.toLowerCase());
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.value.toLowerCase().includes(search.toLowerCase()) ||
      item.tool.toLowerCase().includes(search.toLowerCase());
    return matchesTool && matchesSearch;
  });

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    showToast(`Copied "${val}" to clipboard!`, 'success');
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-12 select-none">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-100 text-[#8064E8]">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-[#1D2940]">Measurement History</h1>
          </div>
          <p className="text-sm text-[#66758D]">
            Search, filter and export your chronological log of verified physical and digital measurements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className="px-5 py-2.5 rounded-full bg-[#EEF3FF] text-[#4385E8] font-bold text-xs hover:bg-[#DCE5F2] transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Center</span>
          </button>

          {items.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all measurement history items?')) {
                  clearHistory();
                  showToast('History cleared', 'info');
                }
              }}
              className="px-4 py-2.5 rounded-full bg-red-50 text-red-500 font-bold text-xs hover:bg-red-100 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search measurements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-brand-violet"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterTool}
            onChange={(e) => setFilterTool(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#1D2940] outline-none"
          >
            <option value="all">All Tools</option>
            <option value="Precision Studio">Precision Studio</option>
            <option value="Screw Gauge">Screw Gauge</option>
            <option value="Vernier Caliper">Vernier Caliper</option>
            <option value="Quick Measure">Quick Measure</option>
            <option value="Unit Converter">Unit Converter</option>
          </select>
        </div>
      </div>

      {/* History Items List */}
      <div className="flex flex-col gap-3">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-100">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No measurements match your filter.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white border border-[#DCE5F2] hover:border-brand-blue/30 shadow-sm flex items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EEF3FF] text-[#4385E8] flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  {item.unit}
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-[#1D2940] font-mono">
                    {item.value}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-[#8E9CAE] mt-0.5">
                    <span className="font-bold text-[#4385E8]">{item.tool}</span>
                    <span>&bull;</span>
                    <span>{item.title}</span>
                    {item.details && (
                      <>
                        <span>&bull;</span>
                        <span className="italic">{item.details}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => handleCopy(item.value)}
                  title="Copy reading"
                  className="p-2 rounded-xl text-slate-400 hover:text-[#4385E8] hover:bg-slate-50 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  title="Remove log"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
