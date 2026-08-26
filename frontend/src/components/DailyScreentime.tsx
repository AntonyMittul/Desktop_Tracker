'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ActivityEvent } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DailyScreentimeProps {
  events: ActivityEvent[];
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  selectedDateStr: string | null;
  onBarClick: (dateStr: string) => void;
}

export default function DailyScreentime({ 
  events, 
  weekOffset, 
  onPrevWeek, 
  onNextWeek, 
  selectedDateStr, 
  onBarClick 
}: DailyScreentimeProps) {
  
  // Calculate the 7 days of the currently viewed week (Sunday to Saturday)
  const now = new Date();
  const currentDay = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay + (weekOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    weekDays.push({
      dateStr: `${y}-${m}-${day}`,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: 0 // Default 0
    });
  }

  // Aggregate data by date
  events.forEach(event => {
    let dStr = event.started_at;
    if (!dStr.endsWith('Z') && !dStr.includes('+')) {
      dStr += 'Z';
    }
    const d = new Date(dStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const eDate = `${y}-${m}-${day}`;
    
    const dayEntry = weekDays.find(wd => wd.dateStr === eDate);
    if (dayEntry) {
      dayEntry.hours += event.duration_seconds;
    }
  });

  const chartData = weekDays.map(wd => ({
    ...wd,
    hours: Number((wd.hours / 3600).toFixed(2)) // convert to hours
  }));

  // Week label
  const weekStartLabel = new Date(weekDays[0].dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekEndLabel = new Date(weekDays[6].dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekLabel = weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : `${weekStartLabel} - ${weekEndLabel}`;

  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 lg:p-6 rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-stone-100/50 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <div className="flex justify-between items-center mb-2 lg:mb-4 flex-none">
        <h2 className="text-lg lg:text-xl font-semibold text-stone-800 tracking-tight flex items-center">
          Daily Screentime
        </h2>
        <div className="flex items-center space-x-3 text-stone-600">
          <button onClick={onPrevWeek} className="p-1 hover:bg-stone-100 rounded-full transition-colors duration-200">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium w-24 text-center tracking-wide">{weekLabel}</span>
          <button 
            onClick={onNextWeek} 
            disabled={weekOffset >= 0}
            className={`p-1 rounded-full transition-colors duration-200 ${weekOffset >= 0 ? 'text-stone-300 cursor-not-allowed' : 'hover:bg-stone-100'}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="label" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#888' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#888' }}
              tickFormatter={(val) => `${val}h`}
            />
            <Tooltip 
              formatter={(value: number) => {
                const totalMins = Math.round(value * 60);
                const h = Math.floor(totalMins / 60);
                const m = totalMins % 60;
                return [h > 0 ? `${h}h ${m}m` : `${m}m`, 'Screentime'];
              }}
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' }}
            />
            <Bar 
              dataKey="hours" 
              radius={[6, 6, 0, 0]} 
              maxBarSize={50}
              activeBar={false}
              onClick={(data) => {
                if (data && data.dateStr) onBarClick(data.dateStr);
              }}
            >
              {chartData.map((entry, index) => {
                const isSelected = entry.dateStr === selectedDateStr;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    cursor="pointer"
                    fill={isSelected ? '#1A73E8' : '#4285F4'} 
                    className="transition-colors duration-300"
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-center text-stone-400/80 mt-2 flex-none tracking-wide">
        Click on any bar to view details for that day
      </p>
    </div>
  );
}
