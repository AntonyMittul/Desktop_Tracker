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
    const fetchEvents = async () => {
      try {
        const data = await getTodayEvents(1);
        // Filter out the Windows Lock Screen so it doesn't skew our productivity stats
        const filteredData = data.filter(e => e.application.toLowerCase() !== 'lockapp.exe');
        setEvents(filteredData);
      } catch (e) {
        console.error("Failed to fetch events", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
    // Refresh every 30s
    const interval = setInterval(fetchEvents, 30000);
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
