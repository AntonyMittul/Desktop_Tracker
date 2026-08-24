'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

interface ActivityTimelineProps {
  events: any[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events }) => {
  // Simple bucketing into hours
  const hourlyData = Array.from({ length: 24 }).map((_, i) => ({
    hour: i,
    label: `${i}:00`,
    productive: 0,
    distracting: 0,
    neutral: 0
  }));

  events.forEach(event => {
    // Force UTC if the backend didn't attach timezone info
    let dateStr = event.started_at;
    if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr += 'Z';
    }
    const d = parseISO(dateStr);
    const h = d.getHours();
    
    // Very naive categorization for MVP
    const app = event.application.toLowerCase();
    if (app.includes('code') || app.includes('terminal')) {
        hourlyData[h].productive += event.duration_seconds;
    } else if (app.includes('chrome') || app.includes('edge') || app.includes('safari')) {
        hourlyData[h].neutral += event.duration_seconds; 
    } else {
        hourlyData[h].distracting += event.duration_seconds;
    }
  });

  // Convert seconds to minutes for chart
  const chartData = hourlyData.map(d => ({
    ...d,
    productive: Math.round(d.productive / 60),
    neutral: Math.round(d.neutral / 60),
    distracting: Math.round(d.distracting / 60),
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex-shrink-0">Activity Timeline (Minutes)</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickMargin={12} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickMargin={12} />
            <Tooltip cursor={{ fill: '#f3f4f6' }} />
            <Bar dataKey="productive" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
            <Bar dataKey="neutral" stackId="a" fill="#9ca3af" />
            <Bar dataKey="distracting" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
