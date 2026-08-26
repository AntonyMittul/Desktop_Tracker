'use client';

import { useEffect, useState, useMemo } from 'react';
import { getTodayEvents, getHistoricalEvents, ActivityEvent } from '@/lib/api';
import { Activity, Clock, AlertTriangle, Target } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import ActivityRing from '@/components/ActivityRing';
import DailyScreentime from '@/components/DailyScreentime';

const getWeekRange = (offset: number) => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const start = new Date(now);
  start.setDate(now.getDate() - currentDay + (offset * 7));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const formatLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return { 
    startStr: formatLocal(start), 
    endStr: formatLocal(end),
    start,
    end
  };
};

export default function Dashboard() {
  const [todayEvents, setTodayEvents] = useState<ActivityEvent[]>([]);
  const [historicalEvents, setHistoricalEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Selection State
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { startStr, endStr } = getWeekRange(weekOffset);
        
        const [todayData, historyData] = await Promise.all([
          getTodayEvents(1),
          getHistoricalEvents(startStr, endStr, 1)
        ]);
        
        setTodayEvents(todayData);
        setHistoricalEvents(historyData);
      } catch (e) {
        console.error("Failed to fetch data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [weekOffset]); // Re-fetch when week changes

  const displayEvents = useMemo(() => {
    if (!selectedDateStr) return todayEvents;
    
    return historicalEvents.filter(e => {
      let dStr = e.started_at;
      if (!dStr.endsWith('Z') && !dStr.includes('+')) dStr += 'Z';
      const d = new Date(dStr);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const eDate = `${y}-${m}-${day}`;
      return eDate === selectedDateStr;
    });
  }, [selectedDateStr, historicalEvents, todayEvents]);

  const totalSeconds = displayEvents.reduce((acc, curr) => acc + curr.duration_seconds, 0);
  const idleSeconds = displayEvents.filter(e => e.idle).reduce((acc, curr) => acc + curr.duration_seconds, 0);
  const activeSeconds = totalSeconds - idleSeconds;

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading FocusLens...</div>;
  }

  // Format header date display
  let overviewTitle = "Today's Activity Overview";
  if (selectedDateStr) {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    overviewTitle = `Activity for ${dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
  }

  return (
    <main className="h-screen overflow-hidden bg-[#FAF9F6] p-4 lg:p-6 flex flex-col font-sans transition-colors duration-500">
      <div className="max-w-6xl mx-auto w-full h-full flex flex-col space-y-4 lg:space-y-6">
        
        <header className="flex-none flex justify-between items-end">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-stone-800 tracking-tight">ScreenTime Analytics</h1>
            <p className="text-stone-500 mt-1 text-sm lg:text-base font-medium">{overviewTitle}</p>
          </div>
          {selectedDateStr && (
            <button 
              onClick={() => setSelectedDateStr(null)}
              className="text-sm bg-white border border-stone-200 hover:bg-stone-50 hover:shadow-sm text-stone-600 py-1.5 px-4 rounded-full transition-all duration-300 transform active:scale-95"
            >
              Back to Today
            </button>
          )}
        </header>

        <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard 
            title="Total Tracked Time" 
            value={formatDuration(totalSeconds)} 
            icon={Clock} 
          />
          <StatCard 
            title="Active Time" 
            value={formatDuration(activeSeconds)} 
            icon={Target} 
            trend={totalSeconds > 0 ? `${Math.round((activeSeconds/totalSeconds)*100)}% of total` : undefined}
          />
          <StatCard 
            title="Idle Time" 
            value={formatDuration(idleSeconds)} 
            icon={AlertTriangle} 
          />
          <StatCard 
            title="Context Switches" 
            value={displayEvents.length} 
            icon={Activity} 
          />
        </div>

        <div className="flex-grow min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="lg:col-span-1 min-h-0">
            <ActivityRing events={displayEvents} />
          </div>
          <div className="lg:col-span-1 min-h-0">
            <DailyScreentime 
              events={historicalEvents} 
              weekOffset={weekOffset}
              onPrevWeek={() => setWeekOffset(prev => prev - 1)}
              onNextWeek={() => setWeekOffset(prev => prev + 1)}
              selectedDateStr={selectedDateStr}
              onBarClick={(dateStr) => setSelectedDateStr(dateStr)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
