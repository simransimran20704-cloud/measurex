import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useAppStore();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-blue flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200 bg-white/95 text-emerald-900',
    warning: 'border-amber-200 bg-white/95 text-amber-900',
    info: 'border-blue-200 bg-white/95 text-slate-800',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-aurora border backdrop-blur-xl ${
          borders[toast.type]
        }`}
      >
        {icons[toast.type]}
        <span className="text-sm font-medium">{toast.message}</span>
        <button
          onClick={hideToast}
          className="ml-2 text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
