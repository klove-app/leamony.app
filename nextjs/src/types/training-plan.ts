export interface TrainingPlan {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  current_week: number;
  summary: string;
  weekly_structure: {
    [key: string]: {
      focus: string;
      total_distance: number;
      intensity_distribution: {
        easy: string;
        moderate: string;
        hard: string;
      };
    };
  };
  planned_workouts: Array<{
    date: string;
    type: string;
    distance: number;
    duration_minutes: number;
    intensity: string;
    description: string;
    target_zones: {
      heart_rate: string;
      pace: string;
    };
  }>;
} 