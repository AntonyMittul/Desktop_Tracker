'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { ActivityEvent } from '@/lib/api';

interface ActivityRingProps {
  events: ActivityEvent[];
}

const COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#A142F4'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export default function ActivityRing({ events }: ActivityRingProps) {
  const [activeIndex, setActiveIndex] = useState(-1);

  // Aggregate data by application/website
  const appDurations: { [key: string]: number } = {};

  events.forEach(event => {
    let name = event.application;
    if (name === 'Google Chrome' && event.url) {
      try {
        const urlObj = new URL(event.url);
        name = urlObj.hostname;
      } catch (e) {
        name = event.url;
      }
    }
    appDurations[name] = (appDurations[name] || 0) + event.duration_seconds;
  });

  const sortedApps = Object.entries(appDurations)
    .map(([name, duration]) => ({ name, value: duration })) // store in seconds for precision
    .filter(d => d.value >= 2) // keep anything 2 seconds or longer
    .sort((a, b) => b.value - a.value);

  const top4 = sortedApps.slice(0, 4);
  const others = sortedApps.slice(4);
  const otherValue = others.reduce((acc, curr) => acc + curr.value, 0);

  const chartData = [...top4];
  if (otherValue > 0) {
    chartData.push({ name: 'Other', value: otherValue });
  }

  const totalSeconds = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMins = Math.floor((totalSeconds % 3600) / 60);
  const totalText = totalHours > 0 ? `${totalHours} hr, ${totalMins} mins` : `${totalMins} mins`;

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm p-4 lg:p-6 rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-stone-100/50 flex items-center justify-center h-full min-h-[200px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        <p className="text-stone-400 font-medium">No activity logged yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 lg:p-6 rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-stone-100/50 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <h2 className="text-lg lg:text-xl font-semibold text-stone-800 tracking-tight mb-2 lg:mb-4 flex items-center flex-none">
        Your Digital Wellbeing
      </h2>
      <div className="flex-grow min-h-0 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              {...({ activeIndex, activeShape: renderActiveShape } as any)}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              label={({ name }) => name}
              isAnimationActive={false}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => {
                if (typeof value !== 'number') return [value, 'Time Spent'];
                const h = Math.floor(value / 3600);
                const m = Math.floor((value % 3600) / 60);
                
                if (h > 0) return [`${h}h ${m}m`, 'Time Spent'];
                return [m > 0 ? `${m}m` : '<1m', 'Time Spent'];
              }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs font-bold text-gray-400 tracking-widest mb-1">TODAY</span>
          <span className="text-2xl font-bold text-gray-800">{totalText}</span>
        </div>
      </div>
    </div>
  );
}
