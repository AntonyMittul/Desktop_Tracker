import React from 'react';

interface AppBreakdownProps {
  data: { application: string; duration: number }[];
}

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `< 1m`;
};

export const AppBreakdown: React.FC<AppBreakdownProps> = ({ data }) => {
  const sorted = [...data].sort((a, b) => b.duration - a.duration).slice(0, 5);
  const maxDuration = sorted.length > 0 ? sorted[0].duration : 1;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Top Applications</h3>
      <div className="space-y-4">
        {sorted.map((app) => (
          <div key={app.application} className="relative">
            <div className="flex justify-between mb-1 text-sm font-medium">
              <span className="text-gray-700">{app.application}</span>
              <span className="text-gray-500">{formatDuration(app.duration)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${(app.duration / maxDuration) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
