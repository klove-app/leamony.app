'use client';

import { useEffect, useState } from 'react';
import { getRuns } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { Run } from '@/types/run';

export default function ClientDashboard() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadRuns();
    }
  }, [user]);

  const loadRuns = async () => {
    try {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const data = await getRuns({
        start_date: startDate,
        end_date: endDate
      });
      setRuns(data);
    } catch (error) {
      console.error('Error loading runs:', error);
    } finally {
      setIsLoadingRuns(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h1 className="text-2xl font-bold mb-4">Welcome, {user?.username}!</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Yearly Goal</h3>
            <p className="text-3xl font-bold text-blue-600">{user?.goal_km} km</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Total Distance</h3>
            <p className="text-3xl font-bold text-green-600">
              {runs.reduce((total, run) => total + (run.km || run.distance_km || 0), 0).toFixed(1)} km
            </p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Total Runs</h3>
            <p className="text-3xl font-bold text-purple-600">{runs.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Recent Runs</h2>
        </div>
        
        {isLoadingRuns ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : runs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {runs.map((run) => (
                  <tr key={run.log_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(run.date_added).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(run.km || run.distance_km || 0).toFixed(1)} км
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.floor((run.duration || 0) / 60)} мин
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No runs recorded yet. Start running to see your progress!
          </div>
        )}
      </div>
    </main>
  );
} 