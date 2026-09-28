import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    caregiverAvailable: 0,
    caregiverUnavailable: 0,
    familyAvailable: 0,
    familyUnavailable: 0,
  });
  const [todayOverview, setTodayOverview] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchTodayOverview();
    }
  }, [user]);

  async function fetchStats() {
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    const { data: caregiverData } = await supabase
      .from('caregiver_availability')
      .select('status')
      .gte('date', monthStart)
      .lte('date', monthEnd);

    const { data: familyData } = await supabase
      .from('family_availability')
      .select('status')
      .gte('date', monthStart)
      .lte('date', monthEnd);

    setStats({
      caregiverAvailable: caregiverData?.filter((d) => d.status === 'disponibile').length || 0,
      caregiverUnavailable: caregiverData?.filter((d) => d.status === 'non_disponibile').length || 0,
      familyAvailable: familyData?.filter((d) => d.status === 'disponibile').length || 0,
      familyUnavailable: familyData?.filter((d) => d.status === 'non_disponibile').length || 0,
    });
  }

  async function fetchTodayOverview() {
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data: caregiverToday } = await supabase
      .from('caregiver_availability')
      .select('*, profiles(full_name)')
      .eq('date', today);

    const { data: familyToday } = await supabase
      .from('family_availability')
      .select('*, profiles(full_name)')
      .eq('date', today);

    const overview = [
      ...(caregiverToday || []).map((d) => ({ ...d, type: 'badante' })),
      ...(familyToday || []).map((d) => ({ ...d, type: 'familiare' })),
    ];

    setTodayOverview(overview);
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👩‍⚕️</span>
            <div>
              <p className="text-sm text-green-700 font-medium">Badanti Disponibili</p>
              <p className="text-2xl font-bold text-green-800">{stats.caregiverAvailable}</p>
              <p className="text-xs text-green-600">questo mese</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚫</span>
            <div>
              <p className="text-sm text-red-700 font-medium">Badanti Non Disponibili</p>
              <p className="text-2xl font-bold text-red-800">{stats.caregiverUnavailable}</p>
              <p className="text-xs text-red-600">questo mese</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👨‍👩‍👧</span>
            <div>
              <p className="text-sm text-purple-700 font-medium">Familiari Disponibili</p>
              <p className="text-2xl font-bold text-purple-800">{stats.familyAvailable}</p>
              <p className="text-xs text-purple-600">questo mese</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📅</span>
            <div>
              <p className="text-sm text-orange-700 font-medium">Familiari Non Disponibili</p>
              <p className="text-2xl font-bold text-orange-800">{stats.familyUnavailable}</p>
              <p className="text-xs text-orange-600">questo mese</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today Overview */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📋</span> Situazione di oggi - {format(new Date(), 'EEEE dd MMMM yyyy', { locale: it })}
        </h3>

        {todayOverview.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <span className="text-4xl block mb-2">📭</span>
            <p>Nessuna disponibilità registrata per oggi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayOverview.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  item.status === 'disponibile'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{item.type === 'badante' ? '👩‍⚕️' : '👨‍👩‍👧'}</span>
                    <span className="font-medium text-gray-800">
                      {(item.profiles as any)?.full_name}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'disponibile'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.status === 'disponibile' ? '✓ Disponibile' : '✗ Non disponibile'}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-sm text-gray-500 mt-2 italic">"{item.notes}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
