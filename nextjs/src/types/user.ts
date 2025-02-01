export interface UserStats {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  yearly_goal: number;
  yearly_progress: number;
  strava_connected?: boolean;
  strava_athlete_info?: {
    firstname: string;
    lastname: string;
  };
  recent_activities: Array<{
    date: string;
    distance: number;
    duration: number;
    type: string;
  }>;
} 