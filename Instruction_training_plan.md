# RunConnect Frontend Integration Guide

## Авторизация пользователя

### 1. Регистрация/Вход в RunConnect
```typescript
// Регистрация нового пользователя
const register = async (username: string, password: string) => {
  const response = await fetch('https://api.runconnect.app/api/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
};

// Вход существующего пользователя
const login = async (username: string, password: string) => {
  const response = await fetch('https://api.runconnect.app/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });
  const data = await response.json();
  // Сохраняем токены
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data;
};
```

### 2. Подключение Strava

```typescript
// Получение URL для авторизации Strava
const getStravaAuthUrl = async () => {
  const response = await fetch('https://api.runconnect.app/api/v1/strava/auth/url', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  const data = await response.json();
  return data.auth_url;
};

// Обработка callback от Strava
const handleStravaCallback = async (code: string) => {
  const response = await fetch('https://api.runconnect.app/api/v1/strava/auth/callback', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
    params: { code },
  });
  return response.json();
};

// Проверка статуса подключения к Strava
const checkStravaConnection = async () => {
  const response = await fetch('https://api.runconnect.app/api/v1/strava/connection/status', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  return response.json();
};
```

### 3. Процесс авторизации Strava

```typescript
const connectStrava = async () => {
  try {
    // 1. Получаем URL для авторизации
    const authUrl = await getStravaAuthUrl();
    
    // 2. Открываем окно авторизации Strava
    const stravaWindow = window.open(authUrl, 'Strava Authorization', 
      'width=600,height=800');
    
    // 3. Слушаем сообщение от окна авторизации
    window.addEventListener('message', async (event) => {
      if (event.origin !== 'https://api.runconnect.app') return;
      
      const { code } = event.data;
      if (code) {
        // 4. Обмениваем код на токены
        const result = await handleStravaCallback(code);
        if (result.success) {
          // 5. Обновляем UI, показываем успешное подключение
          updateConnectionStatus();
        }
      }
    });
  } catch (error) {
    console.error('Error connecting Strava:', error);
  }
};
```

## Работа с тренировками

### 1. Загрузка истории тренировок

```typescript
const syncStravaHistory = async (months: number = 6) => {
  const response = await fetch('https://api.runconnect.app/api/v1/strava/sync/history', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ months }),
  });
  return response.json();
};
```

### 2. Получение списка тренировок

```typescript
const getRunningLogs = async (params: {
  start_date?: string,
  end_date?: string,
  limit?: number,
  offset?: number,
}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });

  const response = await fetch(
    `https://api.runconnect.app/api/v1/runs?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  return response.json();
};
```

## Работа с профилем пользователя

### 1. Получение профиля

```typescript
const getUserProfile = async () => {
  const response = await fetch('https://api.runconnect.app/api/v1/users/me', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  return response.json();
};
```

### 2. Обновление профиля

```typescript
interface ProfileUpdateData {
  email?: string;
  yearly_goal?: number;
  password?: string;
}

const updateUserProfile = async (data: ProfileUpdateData) => {
  const response = await fetch('https://api.runconnect.app/api/v1/users/me', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};
```

### 3. Пример компонента профиля

```typescript
const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [yearlyGoal, setYearlyGoal] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
      setYearlyGoal(data.yearly_goal || 0);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleUpdateGoal = async () => {
    try {
      await updateUserProfile({ yearly_goal: yearlyGoal });
      await loadProfile();
      setIsEditing(false);
    } catch (error) {
      handleApiError(error);
    }
  };

  return (
    <div>
      <h2>Профиль</h2>
      {profile && (
        <>
          <p>Имя пользователя: {profile.username}</p>
          <p>Email: {profile.email}</p>
          
          <div>
            <h3>Годовая цель</h3>
            {isEditing ? (
              <>
                <input
                  type="number"
                  value={yearlyGoal}
                  onChange={(e) => setYearlyGoal(Number(e.target.value))}
                />
                <button onClick={handleUpdateGoal}>Сохранить</button>
                <button onClick={() => setIsEditing(false)}>Отмена</button>
              </>
            ) : (
              <>
                <p>Цель: {profile.yearly_goal} км</p>
                <p>Прогресс: {profile.yearly_progress} км</p>
                <button onClick={() => setIsEditing(true)}>Изменить цель</button>
              </>
            )}
          </div>

          {profile.strava_connected && (
            <div>
              <h3>Strava</h3>
              <p>Подключено</p>
              {profile.strava_athlete_info && (
                <p>Атлет: {profile.strava_athlete_info.firstname} {profile.strava_athlete_info.lastname}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

## Обработка ошибок

```typescript
const handleApiError = (error: any) => {
  if (error.status === 401) {
    // Токен истек, нужно обновить
    refreshToken();
  } else if (error.status === 400 && error.detail === "User not connected to Strava") {
    // Пользователь не подключил Strava
    redirectToStravaConnect();
  } else {
    // Общая обработка ошибок
    showError(error.detail || 'Произошла ошибка');
  }
};
```

## Рекомендации по безопасности

1. Всегда храните токены в безопасном месте (например, httpOnly cookies)
2. Проверяйте origin при получении сообщений от окна авторизации
3. Используйте HTTPS для всех запросов
4. Не храните чувствительные данные в localStorage
5. Обновляйте токены заранее, не дожидаясь их истечения

## Пример интеграции с React

```typescript
import { useState, useEffect } from 'react';

const StravaConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [athlete, setAthlete] = useState(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const status = await checkStravaConnection();
      setIsConnected(status.is_connected);
      if (status.is_connected) {
        setAthlete(status.athlete);
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleConnect = async () => {
    try {
      await connectStrava();
      await checkConnection();
    } catch (error) {
      handleApiError(error);
    }
  };

  return (
    <div>
      {!isConnected ? (
        <button onClick={handleConnect}>
          Подключить Strava
        </button>
      ) : (
        <div>
          <p>Подключено к Strava</p>
          <p>Атлет: {athlete?.firstname} {athlete?.lastname}</p>
          <button onClick={() => syncStravaHistory()}>
            Синхронизировать историю
          </button>
        </div>
      )}
    </div>
  );
};
```

# Интеграция с фронтендом

## Структура данных плана тренировок

При получении плана тренировок (`GET /api/v1/training-plans/{plan_id}`) ответ содержит следующую структуру:

```typescript
interface TrainingPlan {
  id: string;
  start_date: string;  // YYYY-MM-DD
  end_date: string;    // YYYY-MM-DD
  status: string;
  current_week: number;
  
  // Общее описание плана
  summary: string;     
  
  // Структура по неделям
  weekly_structure: {  
    week_1: {
      focus: string;   // Фокус и цели недели
      total_distance: number;
      intensity_distribution: {
        easy: string;
        moderate: string;
        hard: string;
      }
    },
    week_2: {
      // Аналогичная структура
    }
  };
  
  // Общие рекомендации
  recommendations: {   
    nutrition: string[];
    recovery: string[];
    adaptation: string[];
  };

  planned_workouts: Array<{
    id: string;
    scheduled_date: string;
    status: string;
    distance_km: number;
    duration_minutes: number;
    intensity_type: string;
    description: string;
    notes: string;
    
    // Расширенная информация о зонах
    target_zones: {    
      warmup: string;
      main: string;
      cooldown: string;
      warmup_pace?: string;
      main_pace?: string;
      cooldown_pace?: string;
    };
    
    // Информация об интервалах (опционально)
    intervals?: Array<{
      distance: string;
      pace: string;
      recovery: string;
      repetitions: number;
    }>;
    
    workout_type: {
      id: string;
      name: string;
      description: string;
      intensity_level: string;
    };
    
    details: {
      warmup: {
        description: string;
      };
      cooldown: {
        description: string;
      };
      nutrition: {
        pre_workout: string[];
        during: string[];
        post_workout: string[];
      };
      recovery: {
        priority: string;
        recommendations: string[];
        next_workout: string;
      };
      equipment?: {
        required: string[];
        optional: string[];
      };
    };
  }>;
}
```

## Рекомендации по отображению

### 1. Общий обзор плана

```typescript
function TrainingPlanOverview({ plan }: { plan: TrainingPlan }) {
  return (
    <div>
      <h1>План тренировок</h1>
      <div className="summary">
        <h2>Общее описание</h2>
        <p>{plan.summary}</p>
      </div>
      
      <div className="weeks-overview">
        {Object.entries(plan.weekly_structure).map(([week, data]) => (
          <div key={week} className="week-card">
            <h3>Неделя {week.split('_')[1]}</h3>
            <p><strong>Фокус:</strong> {data.focus}</p>
            <p><strong>Общая дистанция:</strong> {data.total_distance} км</p>
            <div className="intensity-distribution">
              <div style={{width: data.intensity_distribution.easy}}>Легкая</div>
              <div style={{width: data.intensity_distribution.moderate}}>Средняя</div>
              <div style={{width: data.intensity_distribution.hard}}>Высокая</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="recommendations">
        <h2>Рекомендации</h2>
        <h3>Питание</h3>
        <ul>
          {plan.recommendations.nutrition.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
        {/* Аналогично для recovery и adaptation */}
      </div>
    </div>
  );
}
```

### 2. Календарь тренировок

```typescript
function WorkoutCalendar({ workouts }: { workouts: TrainingPlan['planned_workouts'] }) {
  return (
    <div className="calendar">
      {workouts.map(workout => (
        <div key={workout.id} className={`workout-card ${workout.intensity_type}`}>
          <div className="workout-header">
            <h3>{workout.workout_type.name}</h3>
            <span>{formatDate(workout.scheduled_date)}</span>
          </div>
          
          <div className="workout-stats">
            <div>{workout.distance_km} км</div>
            <div>{workout.duration_minutes} мин</div>
            <div>{workout.intensity_type}</div>
          </div>
          
          <div className="workout-zones">
            <h4>Целевые зоны</h4>
            <div>Разминка: {workout.target_zones.warmup}</div>
            <div>Основная часть: {workout.target_zones.main}</div>
            <div>Заминка: {workout.target_zones.cooldown}</div>
          </div>
          
          {workout.intervals && (
            <div className="intervals">
              <h4>Интервалы</h4>
              {workout.intervals.map((interval, i) => (
                <div key={i}>
                  {interval.repetitions}x {interval.distance} @ {interval.pace}
                  <div>Восстановление: {interval.recovery}</div>
                </div>
              ))}
            </div>
          )}
          
          <div className="workout-details">
            <Accordion>
              <AccordionItem title="Описание">
                {workout.description}
              </AccordionItem>
              
              <AccordionItem title="Разминка/Заминка">
                <div>{workout.details.warmup.description}</div>
                <div>{workout.details.cooldown.description}</div>
              </AccordionItem>
              
              <AccordionItem title="Питание">
                <h5>До тренировки</h5>
                <ul>
                  {workout.details.nutrition.pre_workout.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                {/* Аналогично для during и post_workout */}
              </AccordionItem>
              
              <AccordionItem title="Восстановление">
                <div>Приоритет: {workout.details.recovery.priority}</div>
                <ul>
                  {workout.details.recovery.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
                <div>До следующей тренировки: {workout.details.recovery.next_workout}</div>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 3. Стили

```scss
.workout-card {
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  
  &.low {
    background-color: #e8f5e9;
    border-left: 4px solid #4caf50;
  }
  
  &.moderate {
    background-color: #fff3e0;
    border-left: 4px solid #ff9800;
  }
  
  &.high {
    background-color: #ffebee;
    border-left: 4px solid #f44336;
  }
}

.intensity-distribution {
  display: flex;
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
  
  > div {
    transition: width 0.3s ease;
    
    &:nth-child(1) { background-color: #4caf50; }
    &:nth-child(2) { background-color: #ff9800; }
    &:nth-child(3) { background-color: #f44336; }
  }
}
```

## Основные изменения

1. Добавлено отображение общего описания плана (`summary`)
2. Появилась структура по неделям с распределением интенсивности
3. Добавлены общие рекомендации по питанию и восстановлению
4. Расширена информация о каждой тренировке:
   - Более детальная информация о зонах
   - Структурированные данные об интервалах
   - Подробные рекомендации по питанию
   - Информация о восстановлении

## Рекомендации по реализации

1. Использовать табы или аккордеон для отображения деталей тренировки
2. Добавить цветовую индикацию интенсивности
3. Сделать интерактивный календарь с возможностью переключения между неделями
4. Добавить графики распределения нагрузки по неделям 