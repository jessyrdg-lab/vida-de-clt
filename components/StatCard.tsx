
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subLabel?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, subLabel }) => {
  const themeMap: Record<string, { bg: string, text: string, darkText: string }> = {
    'bg-emerald-500': { bg: 'bg-emerald-500', text: 'text-emerald-600', darkText: 'dark:text-emerald-400' },
    'bg-violet-500': { bg: 'bg-violet-500', text: 'text-violet-600', darkText: 'dark:text-violet-400' },
    'bg-primary': { bg: 'bg-primary', text: 'text-primary', darkText: 'dark:text-primary' },
    'bg-rose-500': { bg: 'bg-rose-500', text: 'text-rose-600', darkText: 'dark:text-rose-400' },
    'bg-orange-500': { bg: 'bg-orange-500', text: 'text-orange-600', darkText: 'dark:text-orange-400' },
    'bg-amber-700': { bg: 'bg-amber-700', text: 'text-amber-700', darkText: 'dark:text-amber-500' },
  };

  const theme = themeMap[color] || { bg: 'bg-slate-500', text: 'text-slate-600', darkText: 'dark:text-slate-400' };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-3 md:space-x-4 transition-all hover:border-slate-200 dark:hover:border-slate-700">
      <div className={`p-2.5 md:p-3 rounded-lg ${theme.bg} bg-opacity-10 dark:bg-opacity-20 ${theme.text} ${theme.darkText} flex items-center justify-center min-w-[40px] md:min-w-[48px] shadow-inner`}>
        <span className="text-xl md:text-2xl leading-none">{icon}</span>
      </div>
      <div className="overflow-hidden">
        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate mb-0.5">{label}</p>
        <div className="flex flex-col">
          <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">{value}</h3>
          {subLabel && (
            <span className="text-[8px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-tighter mt-1 bg-rose-50 dark:bg-rose-900/40 px-1.5 py-0.5 rounded-md self-start border border-rose-100 dark:border-rose-900/50">
              {subLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};