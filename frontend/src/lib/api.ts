import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
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

export const getTodayEvents = async (userId: number = 1): Promise<ActivityEvent[]> => {
  const response = await api.get(`/activity/today?user_id=${userId}`);
  return response.data;
};
