import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  isWeekend,
} from 'date-fns';
import { it } from 'date-fns/locale';

// Italian public holidays (simplified - major ones)
function isItalianHoliday(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const holidays = [
    '01-01', // Capodanno
    '01-06', // Epifania
    '04-25', // Liberazione
    '05-01', // Festa del Lavoro
    '06-02', // Festa della Repubblica
    '08-15', // Ferragosto
    '11-01', // Ognissanti
    '12-08', // Immacolata
    '12-25', // Natale
    '12-26', // Santo Stefano
  ];
  const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return holidays.includes(dateStr);
}

export default function FamilyCalendar() {
  const { user, profile } = useAuth();
  const { showLocalNotification } = usePushNotifications();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, { status: string; notes?: string; start_time?: string; end_time?: string }>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalStatus, setModalStatus] = useState<'disponibile' | 'non_disponibile'>('disponibile');
  const [modalNotes, setModalNotes] = useState('');
  const [modalStartTime, setModalStartTime] = useState('09:00');
  const [modalEndTime, setModalEndTime] = useState('18:00');
  const [showModal, setShowModal] = useState(false);
  const [allFamilyAvailability, setAllFamilyAvailability] = useState<any[]>([]);
  const [allCaregiverAvailability, setAllCaregiverAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyAvailability();
      fetchAllAvailability();
      fetchAllCaregiverAvailability();
    }
  }, [user, currentMonth]);

  async function fetchMyAvailability() {
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('family_availability')
      .select('*')
      .eq('user_id', user?.id)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    if (data) {
      const map: Record<string, { status: string; notes?: string; start_time?: string; end_time?: string }> = {};
      data.forEach((item) => {
        map[item.date] = { 
          status: item.status, 
          notes: item.notes,
          start_time: item.start_time,
          end_time: item.end_time,
        };
      });
      setAvailability(map);
    }
    setLoading(false);
  }

  async function fetchAllAvailability() {
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('family_availability')
      .select('*, profiles(full_name, avatar)')
      .gte('date', monthStart)
      .lte('date', monthEnd);

    if (data) {
      setAllFamilyAvailability(data);
    }
  }

  async function fetchAllCaregiverAvailability() {
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('caregiver_availability')
      .select('*, profiles(full_name, avatar)')
      .gte('date', monthStart)
      .lte('date', monthEnd);

    if (data) {
      setAllCaregiverAvailability(data);
    }
  }

  async function handleDayClick(date: Date) {
    if (!isSameMonth(date, currentMonth)) return;
    // I familiari possono inserire disponibilità in tutti i giorni della settimana
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = availability[dateStr];
    setModalStatus(existing?.status === 'non_disponibile' ? 'non_disponibile' : 'disponibile');
    setModalNotes(existing?.notes || '');
    setModalStartTime(existing?.start_time || '09:00');
    setModalEndTime(existing?.end_time || '18:00');
    setShowModal(true);
  }

  async function saveAvailability() {
    if (!selectedDate || !user) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const timeInfo = `dalle ${modalStartTime} alle ${modalEndTime}`;

    const { error } = await supabase.from('family_availability').upsert({
      user_id: user.id,
      date: dateStr,
      status: modalStatus,
      start_time: modalStartTime,
      end_time: modalEndTime,
      notes: modalNotes || null,
    });

    if (!error) {
      await sendNotification(
        `${profile?.full_name} ha aggiornato la propria disponibilità familiare per il ${format(selectedDate, 'dd/MM/yyyy')}: ${modalStatus === 'disponibile' ? `Disponibile ${timeInfo}` : 'Non disponibile'}`
      );
      
      // Mostra notifica locale
      showLocalNotification(
        'Disponibilità familiare aggiornata',
        `${profile?.full_name} ha aggiornato la disponibilità per il ${format(selectedDate, 'dd/MM/yyyy')}`,
        '/'
      );
      
      setShowModal(false);
      fetchMyAvailability();
      fetchAllAvailability();
    }
  }

  async function removeAvailability() {
    if (!selectedDate || !user) return;
    if (!confirm(`Sei sicuro di voler rimuovere la disponibilità per il ${format(selectedDate, 'dd/MM/yyyy')}?`)) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const { error } = await supabase
      .from('family_availability')
      .delete()
      .eq('user_id', user.id)
      .eq('date', dateStr);

    if (!error) {
      await sendNotification(
        `${profile?.full_name} ha RIMOSSO la propria disponibilità familiare per il ${format(selectedDate, 'dd/MM/yyyy')}`
      );
      
      // Mostra notifica locale
      showLocalNotification(
        'Disponibilità rimossa',
        `${profile?.full_name} ha rimosso la disponibilità per il ${format(selectedDate, 'dd/MM/yyyy')}`,
        '/'
      );
      
      setShowModal(false);
      fetchMyAvailability();
      fetchAllAvailability();
    }
  }

  async function sendNotification(message: string) {
    const { data: profiles } = await supabase.from('profiles').select('id');
    if (profiles) {
      const notifications = profiles
        .filter((p) => p.id !== user?.id)
        .map((p) => ({
          user_id: p.id,
          message,
          read: false,
        }));

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }
    }
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  // Preset orari rapidi (per weekend/festivi)
  const timePresets = [
    { label: 'Mattina (9-13)', start: '09:00', end: '13:00' },
    { label: 'Pranzo (12-15)', start: '12:00', end: '15:00' },
    { label: 'Pomeriggio (15-19)', start: '15:00', end: '19:00' },
    { label: 'Intera giornata (9-19)', start: '09:00', end: '19:00' },
    { label: 'Solo pranzo (12-14)', start: '12:00', end: '14:00' },
  ];

  // Function to calculate coverage percentage based on hours
  function getCoveragePercentage(startTime?: string, endTime?: string): number {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const hours = (endH + endM / 60) - (startH + startM / 60);
    return Math.min((hours / 24) * 100, 100);
  }

  return (
    <div className="bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">👨‍👩‍👧‍👦</span> Calendario Familiari
        </h2>
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

      <p className="text-sm text-gray-400 mb-4">
        💡 Clicca su qualsiasi giorno per indicare la tua disponibilità.
      </p>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-700 border border-gray-700 rounded-lg overflow-hidden">
        {days.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEntries = allFamilyAvailability.filter(e => e.date === dateStr);
          const caregiverDayEntries = allCaregiverAvailability.filter(e => e.date === dateStr);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const dayIsToday = isToday(day);
          const dayIsHoliday = isItalianHoliday(day);
          const isClickable = isCurrentMonth;

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              disabled={!isClickable}
              className={`
                relative p-1 sm:p-2 min-h-[80px] sm:min-h-[120px] text-left transition
                ${!isClickable ? 'bg-gray-900 opacity-40 cursor-default' : 'bg-gray-800 hover:bg-gray-750 cursor-pointer'}
                ${dayIsHoliday && isCurrentMonth ? 'bg-yellow-900/10' : ''}
              `}
            >
              {/* Numero del giorno */}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs sm:text-sm font-medium ${
                  dayIsToday 
                    ? 'bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                    : 'text-gray-300'
                }`}>
                  {format(day, 'd')}
                </span>
                {dayIsHoliday && isCurrentMonth && (
                  <span className="text-xs">🎉</span>
                )}
              </div>

              {/* Eventi - Stile Google Calendar */}
              <div className="space-y-0.5">
                {/* Familiari */}
                {dayEntries.slice(0, 3).map((entry, i) => (
                  <div
                    key={i}
                    className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                      entry.status === 'disponibile'
                        ? 'bg-purple-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                    title={`${(entry.profiles as any)?.full_name}: ${entry.start_time}-${entry.end_time}`}
                  >
                    {entry.start_time && entry.end_time ? `${entry.start_time}` : ''}
                  </div>
                ))}
                
                {/* Badanti */}
                {caregiverDayEntries.slice(0, 2).map((entry, i) => (
                  <div
                    key={i}
                    className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded truncate font-medium opacity-70 ${
                      entry.status === 'disponibile'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                    title={`Badante: ${(entry.profiles as any)?.full_name}: ${entry.start_time}-${entry.end_time}`}
                  >
                    {entry.start_time && entry.end_time ? `${entry.start_time}` : ''}
                  </div>
                ))}

                {/* Contatore eventi extra */}
                {dayEntries.length + caregiverDayEntries.length > 5 && (
                  <div className="text-[8px] sm:text-[9px] text-gray-400 font-medium">
                    +{dayEntries.length + caregiverDayEntries.length - 5} altri
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
          <div className="w-4 h-4 bg-purple-600 rounded"></div>
          <span>Familiare disponibile</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded opacity-70"></div>
          <span>Badante</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <span>Non disponibile</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-2">
              {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: it })}
              {isItalianHoliday(selectedDate) && (
                <span className="ml-2 text-sm font-normal text-purple-400">
                  🎉 Festivo
                </span>
              )}
            </h3>

            {/* Banner: disponibilità esistente */}
            {selectedDate && availability[format(selectedDate, 'yyyy-MM-dd')] && (
              <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3 mb-4 flex items-start gap-2">
                <span className="text-lg">ℹ️</span>
                <div className="text-sm text-amber-300">
                  <p className="font-medium">Hai già inserito una disponibilità per questo giorno</p>
                  <p className="text-amber-400 mt-0.5">
                    Puoi modificarla qui sotto oppure rimuoverla completamente con il pulsante in fondo.
                  </p>
                </div>
              </div>
            )}

            {/* Analisi copertura oraria */}
            {selectedDate && (() => {
              const dateStr = format(selectedDate, 'yyyy-MM-dd');
              const dayEntries = allFamilyAvailability.filter(e => e.date === dateStr);
              const caregiverDayEntries = allCaregiverAvailability.filter(e => e.date === dateStr);
              const allAvailable = [...dayEntries, ...caregiverDayEntries].filter(e => e.status === 'disponibile' && e.start_time && e.end_time);
              
              if (allAvailable.length === 0) {
                return (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-300 font-medium">⚠️ Nessuna copertura</p>
                    <p className="text-xs text-red-400 mt-1">24 ore scoperte - nessuna disponibilità registrata</p>
                  </div>
                );
              }
              
              // Converti orari in minuti
              const intervals = allAvailable.map(e => {
                const [startH, startM] = e.start_time!.split(':').map(Number);
                const [endH, endM] = e.end_time!.split(':').map(Number);
                return { start: startH * 60 + startM, end: endH * 60 + endM };
              });
              
              // Ordina e unisci intervalli sovrapposti
              intervals.sort((a, b) => a.start - b.start);
              const merged: Array<{ start: number; end: number }> = [];
              intervals.forEach(interval => {
                if (merged.length === 0 || merged[merged.length - 1].end < interval.start) {
                  merged.push(interval);
                } else {
                  merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, interval.end);
                }
              });
              
              // Calcola ore coperte e scoperte
              const coveredMinutes = merged.reduce((sum, interval) => sum + (interval.end - interval.start), 0);
              const uncoveredMinutes = (24 * 60) - coveredMinutes;
              const coveredHours = Math.floor(coveredMinutes / 60);
              const coveredMins = coveredMinutes % 60;
              const uncoveredHours = Math.floor(uncoveredMinutes / 60);
              const uncoveredMins = uncoveredMinutes % 60;
              const coveragePercentage = Math.round((coveredMinutes / (24 * 60)) * 100);
              
              // Calcola fasce scoperte
              const uncoveredIntervals: Array<{ start: number; end: number }> = [];
              let lastEnd = 0;
              merged.forEach(interval => {
                if (interval.start > lastEnd) {
                  uncoveredIntervals.push({ start: lastEnd, end: interval.start });
                }
                lastEnd = interval.end;
              });
              if (lastEnd < 24 * 60) {
                uncoveredIntervals.push({ start: lastEnd, end: 24 * 60 });
              }
              
              return (
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-white mb-3">📊 Analisi copertura</h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-400">Ore coperte</p>
                      <p className="text-xl font-bold text-green-400">
                        {coveredHours}h {coveredMins > 0 ? `${coveredMins}m` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Ore scoperte</p>
                      <p className={`text-xl font-bold ${uncoveredMinutes > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                        {uncoveredHours}h {uncoveredMins > 0 ? `${uncoveredMins}m` : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Barra di copertura */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Copertura</span>
                      <span>{coveragePercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          coveragePercentage === 100 ? 'bg-green-500' :
                          coveragePercentage >= 75 ? 'bg-green-400' :
                          coveragePercentage >= 50 ? 'bg-yellow-400' : 'bg-orange-400'
                        }`}
                        style={{ width: `${coveragePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Fasce scoperte */}
                  {uncoveredIntervals.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">⚠️ Fasce orarie scoperte:</p>
                      <div className="space-y-1">
                        {uncoveredIntervals.map((interval, idx) => {
                          const startH = Math.floor(interval.start / 60).toString().padStart(2, '0');
                          const startM = (interval.start % 60).toString().padStart(2, '0');
                          const endH = Math.floor(interval.end / 60).toString().padStart(2, '0');
                          const endM = (interval.end % 60).toString().padStart(2, '0');
                          const duration = interval.end - interval.start;
                          const durationH = Math.floor(duration / 60);
                          const durationM = duration % 60;
                          
                          return (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <span className="text-orange-400 font-mono">
                                {startH}:{startM} - {endH}:{endM}
                              </span>
                              <span className="text-gray-500">
                                ({durationH}h {durationM > 0 ? `${durationM}m` : ''})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {uncoveredMinutes === 0 && (
                    <div className="bg-green-900/30 border border-green-700 rounded p-2 mt-2">
                      <p className="text-xs text-green-300">✅ Giornata completamente coperta</p>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stato</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalStatus('disponibile')}
                    className={`flex-1 py-3 rounded-lg font-medium transition ${
                      modalStatus === 'disponibile'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    ✓ Disponibile
                  </button>
                  <button
                    onClick={() => setModalStatus('non_disponibile')}
                    className={`flex-1 py-3 rounded-lg font-medium transition ${
                      modalStatus === 'non_disponibile'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    ✗ Non disponibile
                  </button>
                </div>
              </div>

              {/* Orari - sempre visibili */}
              <>
                {/* Preset orari rapidi */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Orari rapidi</label>
                  <div className="flex flex-wrap gap-2">
                    {timePresets.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          setModalStartTime(preset.start);
                          setModalEndTime(preset.end);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                          modalStartTime === preset.start && modalEndTime === preset.end
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-purple-500 hover:bg-gray-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      🕐 Inizio
                    </label>
                    <input
                      type="time"
                      value={modalStartTime}
                      onChange={(e) => setModalStartTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      🕐 Fine
                    </label>
                    <input
                      type="time"
                      value={modalEndTime}
                      onChange={(e) => setModalEndTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                    />
                  </div>
                </div>

                <div className={`border rounded-lg p-3 text-sm ${
                  modalStatus === 'disponibile' 
                    ? 'bg-purple-900/30 border-purple-700 text-purple-300'
                    : 'bg-red-900/30 border-red-700 text-red-300'
                }`}>
                  📅 {modalStatus === 'disponibile' ? 'Sarai disponibile' : 'Non sarai disponibile'} dalle <strong>{modalStartTime}</strong> alle <strong>{modalEndTime}</strong>
                </div>
              </>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Note (opzionale)</label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Aggiungi note..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border border-gray-600 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={saveAvailability}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                  >
                    💾 Salva
                  </button>
                </div>
                
                {/* Pulsante Rimuovi - visibile solo se c'è già una disponibilità */}
                {selectedDate && availability[format(selectedDate, 'yyyy-MM-dd')] && (
                  <button
                    onClick={removeAvailability}
                    className="w-full py-3 bg-red-900/30 border-2 border-red-700 text-red-300 rounded-lg font-medium hover:bg-red-900/50 transition flex items-center justify-center gap-2"
                  >
                    <span>🗑️</span>
                    <span>Rimuovi questa disponibilità</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
