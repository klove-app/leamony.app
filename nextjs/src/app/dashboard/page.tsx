'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import ClientWrapper from '@/components/ClientWrapper';
import Image from 'next/image';

interface TrainingPlan {
  id: string;
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
      }
    }
  };
}

interface UserStats {
  yearly_goal: number;
  yearly_progress: number;
  recent_activities: Array<{
    date: string;
    distance: number;
    duration: number;
    type: string;
  }>;
}

interface Run {
  log_id: number;
  user_id: string;
  date_added: string;
  distance_km: number;
  duration: number;
  notes?: string;
  average_heartrate?: number;
  splits?: {
    [key: string]: {
      distance: number;
      pace: string;
    }
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      const token = document.cookie.match(/access_token=([^;]+)/)?.[1];
      if (!token) return;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      // Загружаем активный план
      fetch('https://api.runconnect.app/api/v1/training-plan/current', { headers })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'completed') {
            setActivePlan(data.plan);
          }
        })
        .catch(console.error);

      // Загружаем статистику
      fetch('https://api.runconnect.app/api/v1/users/me', { headers })
        .then(res => res.json())
        .then(setStats)
        .catch(console.error);

      // Загружаем историю тренировок
      setIsLoadingRuns(true);
      const today = new Date();
      const startDate = new Date();
      startDate.setMonth(today.getMonth() - 1); // За последний месяц

      fetch(`https://api.runconnect.app/api/v1/runs?start_date=${startDate.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}&limit=10`, { headers })
        .then(res => {
          if (!res.ok) throw new Error('Failed to load runs');
          return res.json();
        })
        .then(setRuns)
        .catch(error => {
          console.error('Error loading runs:', error);
        })
        .finally(() => setIsLoadingRuns(false));
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ClientWrapper requireAuth>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container">
          {/* Приветствие и общая статистика */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Добро пожаловать, {user.username}!</h1>
                <p className="text-gray-600">Ваш прогресс к годовой цели</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-color">
                  {stats?.yearly_progress || 0} / {stats?.yearly_goal || 0} км
                </div>
                <div className="text-sm text-gray-500">в этом году</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary-color h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${stats ? (stats.yearly_progress / stats.yearly_goal * 100) : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Сетка с основными элементами */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* План тренировок */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">План тренировок</h2>
                {!activePlan && !isCreatingPlan && (
                  <button 
                    onClick={() => setIsCreatingPlan(true)}
                    className="button button-primary"
                  >
                    Создать план
                  </button>
                )}
              </div>
              
              {isCreatingPlan && (
                <div className="training-plan-form-container">
                  {/* Здесь будет форма создания плана */}
                </div>
              )}

              {activePlan && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">Текущая неделя: {activePlan.current_week}</h3>
                      <p className="text-sm text-gray-600">{activePlan.weekly_structure[`week_${activePlan.current_week}`]?.focus}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {activePlan.weekly_structure[`week_${activePlan.current_week}`]?.total_distance} км
                      </div>
                      <div className="text-sm text-gray-500">на этой неделе</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="p-2 bg-green-50 rounded">
                      <div className="font-medium text-green-700">Легко</div>
                      <div className="text-green-600">
                        {activePlan.weekly_structure[`week_${activePlan.current_week}`]?.intensity_distribution.easy}
                      </div>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded">
                      <div className="font-medium text-yellow-700">Средне</div>
                      <div className="text-yellow-600">
                        {activePlan.weekly_structure[`week_${activePlan.current_week}`]?.intensity_distribution.moderate}
                      </div>
                    </div>
                    <div className="p-2 bg-red-50 rounded">
                      <div className="font-medium text-red-700">Интенсивно</div>
                      <div className="text-red-600">
                        {activePlan.weekly_structure[`week_${activePlan.current_week}`]?.intensity_distribution.hard}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!activePlan && !isCreatingPlan && (
                <div className="text-center py-8">
                  <Image 
                    src="/images/icons/training.svg" 
                    alt="Training" 
                    width={64} 
                    height={64}
                    className="mx-auto mb-4"
                  />
                  <p className="text-gray-600">У вас пока нет активного плана тренировок</p>
                  <p className="text-sm text-gray-500">Создайте свой первый план, чтобы начать тренировки</p>
                </div>
              )}
            </div>

            {/* Последние тренировки */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Последние тренировки</h2>
              {isLoadingRuns ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color"></div>
                </div>
              ) : runs.length > 0 ? (
                <div className="space-y-4">
                  {runs.map((run) => (
                    <div key={run.log_id} className="activity-card">
                      <div>
                        <div className="font-medium">Пробежка</div>
                        <div className="text-sm text-gray-500">
                          {new Date(run.date_added).toLocaleDateString('ru-RU')}
                        </div>
                        {run.notes && (
                          <div className="text-sm text-gray-600 mt-1">{run.notes}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{run.distance_km} км</div>
                        <div className="text-sm text-gray-500">
                          {Math.floor(run.duration / 60)} мин
                        </div>
                        {run.average_heartrate && (
                          <div className="text-sm text-gray-500">
                            ❤️ {run.average_heartrate} уд/мин
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Image 
                    src="/images/icons/activity.svg" 
                    alt="Activities" 
                    width={64} 
                    height={64}
                    className="mx-auto mb-4"
                  />
                  <p className="text-gray-600">Нет тренировок за последний месяц</p>
                  <p className="text-sm text-gray-500">Начните тренироваться, чтобы увидеть свой прогресс</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ClientWrapper>
  );
} 