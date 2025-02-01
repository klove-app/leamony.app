export interface Run {
  log_id: number;
  user_id: string;
  date_added: string;
  distance_km?: number;
  km?: number;
  duration: number;
  notes?: string;
  average_heartrate?: number;
  splits?: {
    [key: string]: {
      distance: number;
      pace: string;
    };
  };
} 