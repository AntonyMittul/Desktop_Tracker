'use client';

import { useEffect, useState } from 'react';
import { Clock, Target, AlertTriangle, Activity } from 'lucide-react';
import { getTodayEvents, ActivityEvent } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { AppBreakdown } from '@/components/AppBreakdown';
import { ActivityTimeline } from '@/components/ActivityTimeline';

export default function Dashboard() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsData = await getTodayEvents(1);
        const filteredData = eventsData.filter(e => e.application.toLowerCase() !== 'lockapp.exe');
        
        // --- Conflict Resolution (Flattening) ---
        const points: { time: number, type: 'start' | 'end', event: ActivityEvent, isDesktop: boolean }[] = [];
        filteredData.forEach(e => {
          let dStr = e.started_at;
          if (!dStr.endsWith('Z') && !dStr.includes('+')) dStr += 'Z';
          const start = new Date(dStr).getTime();
          const end = start + e.duration_seconds * 1000;
          if (start >= end) return;
          const isDesktop = e.application !== 'Google Chrome';
          points.push({ time: start, type: 'start', event: e, isDesktop });
          points.push({ time: end, type: 'end', event: e, isDesktop });
        });
        
        points.sort((a, b) => a.time - b.time);
        
        const activeDesktop = new Set<ActivityEvent>();
        const activeChrome = new Set<ActivityEvent>();
        const flattened: ActivityEvent[] = [];
        
        let currentEvent: ActivityEvent | null = null;
        let currentStartTime = 0;
        
        for (let i = 0; i < points.length; i++) {
          const pt = points[i];
          if (pt.type === 'start') {
            if (pt.isDesktop) activeDesktop.add(pt.event);
            else activeChrome.add(pt.event);
          } else {
            if (pt.isDesktop) activeDesktop.delete(pt.event);
            else activeChrome.delete(pt.event);
          }
          
          let winner: ActivityEvent | null = null;
          if (activeDesktop.size > 0) {
            winner = Array.from(activeDesktop).sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
          } else if (activeChrome.size > 0) {
            winner = Array.from(activeChrome).sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
          }
          
          if (winner !== currentEvent) {
            if (currentEvent && currentStartTime < pt.time) {
              flattened.push({
                ...currentEvent,
                started_at: new Date(currentStartTime).toISOString(),
                duration_seconds: Math.round((pt.time - currentStartTime) / 1000)
              });
            }
            currentEvent = winner;
            currentStartTime = pt.time;
          }
        }
        
        const finalEvents = flattened.filter(e => e.duration_seconds > 0);
        setEvents(finalEvents);
      } catch (e) {
        console.error("Failed to fetch data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalSeconds = events.reduce((acc, curr) => acc + curr.duration_seconds, 0);
  const idleSeconds = events.filter(e => e.idle).reduce((acc, curr) => acc + curr.duration_seconds, 0);
  const activeSeconds = totalSeconds - idleSeconds;

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const appUsage = events.reduce((acc, event) => {
    let key = event.application;
    if (event.url) {
      try {
        key = new URL(event.url).hostname;
      } catch (e) {
        key = event.url;
      }
    }
    acc[key] = (acc[key] || 0) + event.duration_seconds;
    return acc;
  }, {} as Record<string, number>);

  const appData = Object.entries(appUsage).map(([application, duration]) => ({ application, duration }));

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading FocusLens...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header>
          <h1 className="text-3xl font-bold text-gray-900">FocusLens Dashboard</h1>
          <p className="text-gray-500 mt-1">Today's Activity Overview</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            value={events.length} 
            icon={Activity} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActivityTimeline events={events} />
          </div>
          <div className="lg:col-span-1">
            <AppBreakdown data={appData} />
          </div>
        </div>
      </div>
    </main>
  );
}
