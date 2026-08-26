import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-stone-100/50 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-stone-500 font-medium text-sm tracking-wide">{title}</h3>
        <Icon className="text-blue-500/80 w-5 h-5" />
      </div>
      <div className="text-3xl font-semibold text-stone-800 tracking-tight">{value}</div>
      {trend && <div className="text-sm text-emerald-500/90 mt-2 font-medium">{trend}</div>}
    </div>
  );
};
