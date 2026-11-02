import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { useHistoryStore } from '../../stores/historyStore';
import { MagneticCard } from '../../components/common/MagneticCard';
import { Clock, ArrowRight, ArrowUpRight, Copy, Disc, Box } from 'lucide-react';

export const MeasurementHistorySection: React.FC = () => {
  const { setActiveTab, showToast } = useAppStore();
  const { items } = useHistoryStore();

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    showToast(`Copied "${text}" to clipboard!`, 'success');
  };

  const getMeasurementIcon = (index: number) => {
    if (index === 0) {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#4385E8] flex items-center justify-center flex-shrink-0">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-purple-50 text-[#8064E8] flex items-center justify-center flex-shrink-0">
          <Disc className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
        <Box className="w-4 h-4" />
      </div>
    );
  };

  return (
    <MagneticCard className="p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-[#8064E8]">
            <Clock className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sm text-[#1D2940]">Measurement History</h2>
        </div>

        <button
          onClick={() => setActiveTab('history')}
          className="text-xs font-semibold text-[#8064E8] hover:text-[#4385E8] flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* History Items */}
      <div className="flex flex-col gap-3">
        {items.slice(0, 3).map((item, idx) => (
          <div
            key={item.id}
            className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#F8FAFF] border border-transparent hover:border-[#DCE5F2] transition-all"
          >
            <div className="flex items-center gap-3">
              {getMeasurementIcon(idx)}
              <div className="flex flex-col">
                <span className="font-bold text-xs text-[#1D2940]">
                  {item.value}
                </span>
                <span className="text-[11px] text-[#8E9CAE]">
                  {item.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#8E9CAE]">
                {idx === 0 ? '2m ago' : idx === 1 ? '12m ago' : '1h ago'}
              </span>
              <button
                onClick={(e) => handleCopy(e, item.value)}
                title="Copy measurement"
                className="text-slate-400 hover:text-[#4385E8] hover:bg-white p-1 rounded-md transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </MagneticCard>
  );
};
