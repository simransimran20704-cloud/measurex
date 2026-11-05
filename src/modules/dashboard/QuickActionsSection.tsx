import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { useCalibrationStore } from '../../stores/calibrationStore';
import { MagneticCard } from '../../components/common/MagneticCard';
import {
  Zap,
  Target,
  Clock,
  Download,
  FolderKanban,
  ArrowRightLeft,
  HelpCircle,
} from 'lucide-react';

export const QuickActionsSection: React.FC = () => {
  const { setActiveTab } = useAppStore();
  const { openModal } = useCalibrationStore();

  const actions = [
    {
      id: 'calibrate',
      label: 'Calibrate Now',
      icon: Target,
      color: 'text-[#4385E8] bg-blue-50/80 hover:bg-blue-100/80 border-blue-100',
      onClick: () => openModal(),
    },
    {
      id: 'history',
      label: 'View History',
      icon: Clock,
      color: 'text-[#4385E8] bg-blue-50/80 hover:bg-blue-100/80 border-blue-100',
      onClick: () => setActiveTab('history'),
    },
    {
      id: 'export',
      label: 'Export Report',
      icon: Download,
      color: 'text-[#16A078] bg-emerald-50/80 hover:bg-emerald-100/80 border-emerald-100',
      onClick: () => setActiveTab('export'),
    },
    {
      id: 'projects',
      label: 'Open Project',
      icon: FolderKanban,
      color: 'text-[#4385E8] bg-blue-50/80 hover:bg-blue-100/80 border-blue-100',
      onClick: () => setActiveTab('projects'),
    },
    {
      id: 'converter',
      label: 'Online Converter',
      icon: ArrowRightLeft,
      color: 'text-[#4385E8] bg-blue-50/80 hover:bg-blue-100/80 border-blue-100',
      onClick: () => setActiveTab('unit-converter'),
    },
    {
      id: 'help',
      label: 'Help Guide',
      icon: HelpCircle,
      color: 'text-[#8064E8] bg-purple-50/80 hover:bg-purple-100/80 border-purple-100',
      onClick: () => setActiveTab('help'),
    },
  ];

  return (
    <MagneticCard className="p-3.5 sm:p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#4385E8]">
          <Zap className="w-4 h-4" />
        </div>
        <h2 className="font-bold text-sm text-[#1D2940]">Quick Actions</h2>
      </div>

      {/* Grid of 6 Buttons */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border text-center transition-all group active:scale-95 shadow-sm ${act.color}`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-1.5 transition-transform group-hover:scale-110 flex-shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#1D2940] leading-tight line-clamp-1">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </MagneticCard>
  );
};
