import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { MagneticCard } from '../../components/common/MagneticCard';
import {
  FolderKanban,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Edit2,
  Layers,
  Compass,
  Cpu,
  Lock,
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const { projects, createProject, deleteProject, duplicateProject, setActiveProject } = useProjectStore();
  const { setActiveTab, showToast } = useAppStore();
  const { requireAuth, isAuthenticated, user, openAuthModal } = useAuthStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'Precision Studio' | 'Instruments' | 'Workspace' | 'Quick Measure'>('Precision Studio');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    requireAuth('create and persist projects in MeasureX Cloud', () => {
      createProject(newTitle.trim(), newType);
      showToast(`Created project "${newTitle.trim()}"`, 'success');
      setNewTitle('');
      setIsCreating(false);
    });
  };

  const getThumbnail = (type: string) => {
    switch (type) {
      case 'Precision Studio':
        return <Layers className="w-6 h-6 text-[#4385E8]" />;
      case 'Instruments':
        return <Compass className="w-6 h-6 text-[#8064E8]" />;
      default:
        return <Cpu className="w-6 h-6 text-slate-500" />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12 select-none">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-100 text-[#4385E8]">
              <FolderKanban className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-[#1D2940]">Measurement Projects</h1>
          </div>
          <p className="text-sm text-[#66758D]">
            Organize drawing sheets, laboratory caliper test runs, and calibrated workspace layouts.
          </p>
        </div>

        <button
          onClick={() => requireAuth('create and save projects', () => setIsCreating(true))}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white font-bold text-xs shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* New Project Dialog */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="p-6 rounded-3xl bg-white border border-[#4385E8]/40 shadow-xl flex flex-col sm:flex-row items-center gap-4 animate-in fade-in"
        >
          <input
            type="text"
            required
            placeholder="Project Title (e.g. Turbine Rotor Caliper Run)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#1D2940] outline-none focus:border-brand-blue"
          />

          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#1D2940] bg-slate-50 outline-none"
          >
            <option value="Precision Studio">Precision Studio</option>
            <option value="Instruments">Instruments Lab</option>
            <option value="Workspace">Workspace</option>
            <option value="Quick Measure">Quick Measure</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#4385E8] text-white text-xs font-bold shadow-sm hover:bg-[#3474D4]"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <MagneticCard key={proj.id} className="p-6 flex flex-col justify-between h-[210px]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  {getThumbnail(proj.type)}
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#4385E8] border border-blue-200">
                  {proj.type}
                </span>
              </div>

              <h3 className="font-bold text-sm text-[#1D2940] mb-1 line-clamp-1">{proj.title}</h3>
              <p className="text-xs text-[#66758D] line-clamp-2 leading-relaxed">
                {proj.description || 'Custom measurement project workspace'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                {new Date(proj.lastModified).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => duplicateProject(proj.id)}
                  title="Duplicate Project"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => deleteProject(proj.id)}
                  title="Delete Project"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    setActiveProject(proj.id);
                    setActiveTab(proj.type === 'Instruments' ? 'vernier-caliper' : 'precision-studio');
                  }}
                  className="ml-1 px-3 py-1.5 rounded-lg bg-[#EEF3FF] text-[#4385E8] text-xs font-bold hover:bg-[#DCE5F2] flex items-center gap-1"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </MagneticCard>
        ))}
      </div>
    </div>
  );
};
