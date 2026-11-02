import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { useProjectStore } from '../../stores/projectStore';
import { MagneticCard } from '../../components/common/MagneticCard';
import { FolderKanban, ArrowRight, MoreVertical, Layers, Compass, Cpu } from 'lucide-react';

export const RecentProjectsSection: React.FC = () => {
  const { setActiveTab } = useAppStore();
  const { projects, setActiveProject } = useProjectStore();

  const getThumbnail = (type: string) => {
    switch (type) {
      case 'Precision Studio':
        return (
          <div className="w-12 h-10 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#4385E8] bg-grid-pattern-dense">
            <Layers className="w-5 h-5 opacity-80" />
          </div>
        );
      case 'Instruments':
        return (
          <div className="w-12 h-10 rounded-lg bg-purple-50 border border-purple-200/80 flex items-center justify-center text-[#8064E8]">
            <Compass className="w-5 h-5 opacity-80" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-10 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-500 bg-grid-pattern-dense">
            <Cpu className="w-5 h-5 opacity-80" />
          </div>
        );
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'Precision Studio':
        return 'bg-[#EEF3FF] text-[#4385E8] border-[#DCE5F2]';
      case 'Instruments':
        return 'bg-[#F0EDFF] text-[#8064E8] border-[#E0D8FF]';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <MagneticCard className="p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#4385E8]">
            <FolderKanban className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sm text-[#1D2940]">Recent Projects</h2>
        </div>

        <button
          onClick={() => setActiveTab('projects')}
          className="text-xs font-semibold text-[#4385E8] hover:text-[#8064E8] flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Projects List */}
      <div className="flex flex-col gap-3">
        {projects.slice(0, 3).map((proj) => (
          <div
            key={proj.id}
            onClick={() => {
              setActiveProject(proj.id);
              setActiveTab('precision-studio');
            }}
            className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#F3F7FF] border border-transparent hover:border-[#DCE5F2] cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              {getThumbnail(proj.type)}
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-[#1D2940] group-hover:text-[#4385E8] transition-colors">
                  {proj.title}
                </span>
                <span className="text-[11px] text-[#8E9CAE]">
                  Edited {new Date(proj.lastModified).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(
                  proj.type
                )}`}
              >
                {proj.type}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('projects');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </MagneticCard>
  );
};
