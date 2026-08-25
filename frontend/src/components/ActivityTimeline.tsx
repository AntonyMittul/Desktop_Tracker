'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO } from 'date-fns';
import { ActivityEvent } from '@/lib/api';

interface ActivityTimelineProps {
  events: ActivityEvent[];
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
    
    // Very naive categorization for MVP
    const app = event.application.toLowerCase();
    const url = event.url ? event.url.toLowerCase() : '';
    
    let category = 'neutral';
    // Productive apps/sites
    if (app.includes('code') || app.includes('terminal') || url.includes('github.com') || url.includes('stackoverflow.com') || url.includes('localhost')) {
        category = 'productive';
    } 
    // Distracting apps/sites
    else if (url.includes('youtube.com') || url.includes('reddit.com') || url.includes('twitter.com') || url.includes('facebook.com') || url.includes('instagram.com') || app.includes('spotify')) {
        category = 'distracting';
    }

    let currentStart = d.getTime();
    let remainingMs = event.duration_seconds * 1000;

    // Safety limit to avoid infinite loops if data is weird
    let loops = 0;
    while (remainingMs > 0 && loops < 24) {
      const currentHourDate = new Date(currentStart);
      const h = currentHourDate.getHours();
      
      const nextHourDate = new Date(currentStart);
      nextHourDate.setHours(h + 1, 0, 0, 0);
      
      const msToNextHour = nextHourDate.getTime() - currentStart;
      // If msToNextHour is 0 (which shouldn't happen), force it to advance to prevent infinite loop
      const effectiveMsToNextHour = msToNextHour <= 0 ? 3600000 : msToNextHour;
      
      const msInThisHour = Math.min(remainingMs, effectiveMsToNextHour);
      const secondsInThisHour = msInThisHour / 1000;
      
      if (category === 'productive') {
        hourlyData[h].productive += secondsInThisHour;
      } else if (category === 'distracting') {
        hourlyData[h].distracting += secondsInThisHour;
      } else {
        hourlyData[h].neutral += secondsInThisHour;
      }
      
      remainingMs -= msInThisHour;
      currentStart += msInThisHour;
      loops++;
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
