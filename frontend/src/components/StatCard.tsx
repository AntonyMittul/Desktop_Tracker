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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
        <Icon className="text-blue-500 w-5 h-5" />
      </div>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      {trend && <div className="text-sm text-green-500 mt-2 font-medium">{trend}</div>}
    </div>
  );
};
