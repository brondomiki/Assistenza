import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  isWeekend,
  addMonths,
  subMonths,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { extendCaregiverAvailability } from '../lib/availabilityExtender';

// Italian public holidays
function isItalianHoliday(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const holidays = [
    '01-01', '01-06', '04-25', '05-01', '06-02',
    '08-15', '11-01', '12-08', '12-25', '12-26',
  ];
  const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return holidays.includes(dateStr);
}

interface DayEntry {
  id: string;
  user_id: string;
  date: string;
  status: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  type: 'badante' | 'familiare';
  full_name: string;
  avatar?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState({
    caregiverAvailable: 0,
    caregiverUnavailable: 0,
    familyAvailable: 0,
    familyUnavailable: 0,
  });
  const [todayOverview, setTodayOverview] = useState<any[]>([]);
  const [allEntries, setAllEntries] = useState<DayEntry[]>([]);
  const [entriesByDate, setEntriesByDate] = useState<Record<string, DayEntry[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchTodayOverview();
      fetchAllEntries();
      // Estendi automaticamente le disponibilità per i mesi futuri
      extendCaregiverAvailability(user.id, currentMonth);
    }
  }, [user, currentMonth]);

  async function fetchStats() {
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

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
      .select('*, profiles(full_name, avatar)')
      .eq('date', today);

    const { data: familyToday } = await supabase
      .from('family_availability')
      .select('*, profiles(full_name, avatar)')
      .eq('date', today);

    const overview = [
      ...(caregiverToday || []).map((d) => ({ ...d, type: 'badante' })),
      ...(familyToday || []).map((d) => ({ ...d, type: 'familiare' })),
    ];

    setTodayOverview(overview);
  }

  async function fetchAllEntries() {
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const { data: caregiverData } = await supabase
      .from('caregiver_availability')
      .select('*, profiles(full_name, avatar)')
      .gte('date', monthStart)
      .lte('date', monthEnd);

    const { data: familyData } = await supabase
      .from('family_availability')
      .select('*, profiles(full_name, avatar)')
      .gte('date', monthStart)
      .lte('date', monthEnd);

    const all: DayEntry[] = [
      ...(caregiverData || []).map((d) => ({
        ...d,
        type: 'badante' as const,
        full_name: (d.profiles as any)?.full_name || 'Utente',
        avatar: (d.profiles as any)?.avatar || null,
      })),
      ...(familyData || []).map((d) => ({
        ...d,
        type: 'familiare' as const,
        full_name: (d.profiles as any)?.full_name || 'Utente',
        avatar: (d.profiles as any)?.avatar || null,
      })),
    ];

    setAllEntries(all);

    // Group by date
    const grouped: Record<string, DayEntry[]> = {};
    all.forEach((entry) => {
      if (!grouped[entry.date]) grouped[entry.date] = [];
      grouped[entry.date].push(entry);
    });
    setEntriesByDate(grouped);
  }

  function handleDayClick(date: Date) {
    if (!isSameMonth(date, currentMonth)) return;
    setSelectedDate(date);
    setShowModal(true);
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  // Function to calculate coverage percentage based on available hours
  function getDayCoverage(date: Date): { percentage: number; color: string } {
    const dateStr = format(date, 'yyyy-MM-dd');
    const entries = entriesByDate[dateStr] || [];
    
    if (entries.length === 0) return { percentage: 0, color: '' };
    
    // Calculate total available hours
    let totalHours = 0;
    let hasCaregiver = false;
    let hasFamily = false;
    
    entries.forEach((e) => {
      if (e.status === 'disponibile' && e.start_time && e.end_time) {
        const [startH, startM] = e.start_time.split(':').map(Number);
        const [endH, endM] = e.end_time.split(':').map(Number);
        const hours = (endH + endM / 60) - (startH + startM / 60);
        if (hours > 0) totalHours += hours;
        if (e.type === 'badante') hasCaregiver = true;
        if (e.type === 'familiare') hasFamily = true;
      }
    });
    
    // Calculate percentage (max 24 hours)
    const percentage = Math.min((totalHours / 24) * 100, 100);
    
    // Determine color based on who is available
    let color = 'from-green-500 to-green-600';
    if (hasCaregiver && hasFamily) {
      color = 'from-green-500 via-blue-500 to-purple-500';
    } else if (hasFamily) {
      color = 'from-purple-500 to-purple-600';
    }
    
    return { percentage, color };
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-xl p-5 border border-green-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👩‍⚕️</span>
            <div>
              <p className="text-sm text-green-300 font-medium">Badanti Disponibili</p>
              <p className="text-2xl font-bold text-green-200">{stats.caregiverAvailable}</p>
              <p className="text-xs text-green-400">questo mese</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/50 to-red-800/50 rounded-xl p-5 border border-red-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚫</span>
            <div>
              <p className="text-sm text-red-300 font-medium">Badanti Non Disponibili</p>
              <p className="text-2xl font-bold text-red-200">{stats.caregiverUnavailable}</p>
              <p className="text-xs text-red-400">questo mese</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-xl p-5 border border-purple-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👨‍👩‍👧</span>
            <div>
              <p className="text-sm text-purple-300 font-medium">Familiari Disponibili</p>
              <p className="text-2xl font-bold text-purple-200">{stats.familyAvailable}</p>
              <p className="text-xs text-purple-400">questo mese</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/50 rounded-xl p-5 border border-orange-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📅</span>
            <div>
              <p className="text-sm text-orange-300 font-medium">Familiari Non Disponibili</p>
              <p className="text-2xl font-bold text-orange-200">{stats.familyUnavailable}</p>
              <p className="text-xs text-orange-400">questo mese</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today Overview */}
      <div className="bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📋</span> Situazione di oggi - {format(new Date(), 'EEEE dd MMMM yyyy', { locale: it })}
        </h3>

        {todayOverview.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
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
                    ? 'bg-green-900/30 border-green-700'
                    : 'bg-red-900/30 border-red-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {(item.profiles as any)?.avatar || '👤'}
                    </span>
                    <span className="font-medium text-white">
                      {(item.profiles as any)?.full_name}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'disponibile'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {item.status === 'disponibile' ? '✓ Disponibile' : '✗ Non disponibile'}
                  </span>
                </div>
                {item.status === 'disponibile' && item.start_time && item.end_time && (
                  <p className="text-sm text-gray-200 mt-1 font-medium">
                    🕐 {item.start_time} - {item.end_time}
                  </p>
                )}
                {item.notes && (
                  <p className="text-sm text-gray-400 mt-2 italic">"{item.notes}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Calendar with all members */}
      <div className="bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📆</span> Calendario Completo - Tutti i membri
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-300"
            >
              ←
            </button>
            <span className="font-semibold text-white min-w-[150px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: it })}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-300"
            >
              →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const entries = entriesByDate[dateStr] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const dayIsToday = isToday(day);
            const coverage = getDayCoverage(day);

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(day)}
                disabled={!isCurrentMonth}
                className={`
                  relative p-2 min-h-[100px] rounded-lg text-sm transition border overflow-hidden
                  ${!isCurrentMonth ? 'opacity-30 cursor-default' : 'hover:border-indigo-400 cursor-pointer'}
                  ${dayIsToday ? 'border-indigo-500 border-2' : 'border-gray-700'}
                  bg-gray-800
                `}
              >
                {/* Background fill based on coverage */}
                {coverage.percentage > 0 && (
                  <div 
                    className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${coverage.color} opacity-80 transition-all duration-300`}
                    style={{ height: `${coverage.percentage}%` }}
                  />
                )}
                
                {/* Content */}
                <div className="relative z-10">
                  <span className={`font-medium ${dayIsToday ? 'text-indigo-300' : 'text-gray-200'}`}>
                    {format(day, 'd')}
                  </span>
                  {entries.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {/* Avatar membri */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {entries.filter(e => e.status === 'disponibile').slice(0, 3).map((e, i) => (
                          <span
                            key={i}
                            className="text-lg"
                            title={e.full_name}
                          >
                            {e.avatar || (e.type === 'badante' ? '👩‍⚕️' : '👤')}
                          </span>
                        ))}
                        {entries.filter(e => e.status === 'disponibile').length > 3 && (
                          <span className="text-[10px] text-gray-300">
                            +{entries.filter(e => e.status === 'disponibile').length - 3}
                          </span>
                        )}
                      </div>
                      {/* Orari */}
                      <div className="space-y-0.5">
                        {entries.slice(0, 2).map((e, i) => (
                          <div key={i} className="text-[9px] font-medium leading-tight truncate">
                            {e.start_time && e.end_time && (
                              <span className={`${e.status === 'disponibile' ? 'text-white' : 'text-red-300'}`}>
                                {e.start_time}-{e.end_time}
                              </span>
                            )}
                          </div>
                        ))}
                        {entries.length > 2 && (
                          <div className="text-[9px] text-gray-300">+{entries.length - 2} altri</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-t from-green-500 to-green-600 rounded"></div>
            <span>Badante disponibile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-t from-purple-500 to-purple-600 rounded"></div>
            <span>Familiare disponibile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-t from-green-500 via-blue-500 to-purple-500 rounded"></div>
            <span>Entrambi disponibili</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-800 border border-gray-700 rounded"></div>
            <span>Nessuna disponibilità</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-400">📏 Riempimento = ore di copertura</span>
          </div>
        </div>
      </div>

      {/* Modal with day details */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                📅 {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: it })}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400"
              >
                ✕
              </button>
            </div>

            {(() => {
              const dateStr = format(selectedDate, 'yyyy-MM-dd');
              const dayEntries = entriesByDate[dateStr] || [];

              if (dayEntries.length === 0) {
                return (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-5xl block mb-3">📭</span>
                    <p className="text-lg">Nessun inserimento per questo giorno</p>
                    <p className="text-sm mt-2">I membri non hanno ancora inserito la loro disponibilità</p>
                  </div>
                );
              }

              const caregivers = dayEntries.filter(e => e.type === 'badante');
              const families = dayEntries.filter(e => e.type === 'familiare');

              return (
                <div className="space-y-6">
                  {/* Badanti */}
                  {caregivers.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="text-2xl">👩‍⚕️</span>
                        <span>Badanti ({caregivers.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {caregivers.map((entry, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border ${
                              entry.status === 'disponibile'
                                ? 'bg-green-900/30 border-green-700'
                                : 'bg-red-900/30 border-red-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-4xl">
                                  {entry.avatar || '👤'}
                                </span>
                                <span className="font-semibold text-white">{entry.full_name}</span>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  entry.status === 'disponibile'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-red-600 text-white'
                                }`}
                              >
                                {entry.status === 'disponibile' ? '✓ Disponibile' : '✗ Non disponibile'}
                              </span>
                            </div>
                            {entry.status === 'disponibile' && entry.start_time && entry.end_time && (
                              <p className="text-sm text-gray-200 font-medium">
                                🕐 Orario: <span className="font-semibold">{entry.start_time} - {entry.end_time}</span>
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-sm text-gray-400 mt-2 italic bg-gray-800/50 p-2 rounded">
                                💬 {entry.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Familiari */}
                  {families.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="text-2xl">👨‍👩‍👧</span>
                        <span>Familiari ({families.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {families.map((entry, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border ${
                              entry.status === 'disponibile'
                                ? 'bg-purple-900/30 border-purple-700'
                                : 'bg-red-900/30 border-red-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-4xl">
                                  {entry.avatar || '👤'}
                                </span>
                                <span className="font-semibold text-white">{entry.full_name}</span>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  entry.status === 'disponibile'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-red-600 text-white'
                                }`}
                              >
                                {entry.status === 'disponibile' ? '✓ Disponibile' : '✗ Non disponibile'}
                              </span>
                            </div>
                            {entry.status === 'disponibile' && entry.start_time && entry.end_time && (
                              <p className="text-sm text-gray-200 font-medium">
                                🕐 Orario: <span className="font-semibold">{entry.start_time} - {entry.end_time}</span>
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-sm text-gray-400 mt-2 italic bg-gray-800/50 p-2 rounded">
                                💬 {entry.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h4 className="font-semibold text-white mb-2">📊 Riepilogo del giorno</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Disponibili:</p>
                        <p className="text-lg font-bold text-green-400">
                          {dayEntries.filter(e => e.status === 'disponibile').length}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Non disponibili:</p>
                        <p className="text-lg font-bold text-red-400">
                          {dayEntries.filter(e => e.status === 'non_disponibile').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
