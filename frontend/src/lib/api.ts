import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
});

export interface ActivityEvent {
  id: number;
  application: string;
  window_title: string;
  url: string | null;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  idle: boolean;
}

export const flattenEvents = (eventsData: ActivityEvent[]): ActivityEvent[] => {
  if (!Array.isArray(eventsData)) return [];

  const filteredData = eventsData.filter(e => {
    if (!e || !e.application || !e.started_at || typeof e.duration_seconds !== 'number') return false;
    return e.application.toLowerCase() !== 'lockapp.exe';
  });
  
  try {
    const points: { time: number, type: 'start' | 'end', event: ActivityEvent, isDesktop: boolean }[] = [];
    filteredData.forEach(e => {
      let dStr = e.started_at;
      if (!dStr.endsWith('Z') && !dStr.includes('+')) dStr += 'Z';
      const start = new Date(dStr).getTime();
      const end = start + e.duration_seconds * 1000;
      if (isNaN(start) || isNaN(end) || start >= end) return;
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
    
    return flattened.filter(e => e.duration_seconds > 0);
  } catch (error) {
    console.error("Error flattening events:", error);
    return [];
  }
};

export const getTodayEvents = async (userId: number = 1): Promise<ActivityEvent[]> => {
  try {
    const response = await api.get(`/activity/today?user_id=${userId}`);
    return flattenEvents(response.data);
  } catch (error) {
    console.warn("Backend unreachable for getTodayEvents:", error);
    return [];
  }
};

export const getHistoricalEvents = async (startDate: string, endDate: string, userId: number = 1): Promise<ActivityEvent[]> => {
  try {
    const response = await api.get(`/activity/history?start_date=${startDate}&end_date=${endDate}&user_id=${userId}`);
    return flattenEvents(response.data);
  } catch (error) {
    console.warn("Backend unreachable for getHistoricalEvents:", error);
    return [];
  }
};
