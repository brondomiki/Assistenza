import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, { status: string; notes?: string; start_time?: string; end_time?: string }>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalStatus, setModalStatus] = useState<'disponibile' | 'non_disponibile'>('disponibile');
  const [modalNotes, setModalNotes] = useState('');
  const [modalStartTime, setModalStartTime] = useState('09:00');
  const [modalEndTime, setModalEndTime] = useState('18:00');
  const [showModal, setShowModal] = useState(false);
  const [allFamilyAvailability, setAllFamilyAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyAvailability();
      fetchAllAvailability();
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
      .select('*, profiles(full_name)')
      .gte('date', monthStart)
      .lte('date', monthEnd);

    if (data) {
      setAllFamilyAvailability(data);
    }
  }

  async function handleDayClick(date: Date) {
    if (!isSameMonth(date, currentMonth)) return;
    if (!isWeekend(date) && !isItalianHoliday(date)) {
      return;
    }
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

    const timeInfo = modalStatus === 'disponibile' 
      ? `dalle ${modalStartTime} alle ${modalEndTime}` 
      : '';

    const { error } = await supabase.from('family_availability').upsert({
      user_id: user.id,
      date: dateStr,
      status: modalStatus,
      start_time: modalStatus === 'disponibile' ? modalStartTime : null,
      end_time: modalStatus === 'disponibile' ? modalEndTime : null,
      notes: modalNotes || null,
    });

    if (!error) {
      await sendNotification(
        `${profile?.full_name} ha aggiornato la propria disponibilità familiare per il ${format(selectedDate, 'dd/MM/yyyy')}: ${modalStatus === 'disponibile' ? `Disponibile ${timeInfo}` : 'Non disponibile'}`
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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">👨‍👩‍👧‍👦</span> Calendario Familiari (Weekend & Festivi)
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            ←
          </button>
          <span className="font-semibold text-gray-700 min-w-[150px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: it })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            →
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        💡 Clicca sui giorni del weekend (sabato/domenica) o sui giorni festivi per indicare la tua disponibilità.
      </p>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const myAvail = availability[dateStr];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const dayIsToday = isToday(day);
          const dayIsWeekend = isWeekend(day);
          const dayIsHoliday = isItalianHoliday(day);
          const isClickable = isCurrentMonth && (dayIsWeekend || dayIsHoliday);

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              disabled={!isClickable}
              className={`
                relative p-2 min-h-[75px] rounded-lg text-sm transition border
                ${!isClickable ? 'opacity-30 cursor-default' : 'hover:border-purple-300 cursor-pointer'}
                ${dayIsToday ? 'border-purple-500 border-2' : 'border-gray-100'}
                ${dayIsHoliday && isCurrentMonth ? 'bg-yellow-50' : ''}
                ${dayIsWeekend && !dayIsHoliday && isCurrentMonth ? 'bg-purple-50' : ''}
                ${myAvail?.status === 'disponibile' ? 'bg-green-100 border-green-300' : ''}
                ${myAvail?.status === 'non_disponibile' ? 'bg-red-100 border-red-300' : ''}
              `}
            >
              <span className={`font-medium ${dayIsToday ? 'text-purple-600' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </span>
              {dayIsHoliday && isCurrentMonth && (
                <span className="absolute top-0.5 right-0.5 text-xs">🎉</span>
              )}
              {myAvail && (
                <div className="mt-1 space-y-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    myAvail.status === 'disponibile' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {myAvail.status === 'disponibile' ? '✓' : '✗'}
                  </span>
                  {myAvail.status === 'disponibile' && myAvail.start_time && myAvail.end_time && (
                    <div className="text-[10px] text-green-800 font-medium leading-tight">
                      {myAvail.start_time}-{myAvail.end_time}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span>Disponibile</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span>Non disponibile</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-purple-50 border border-gray-100 rounded"></div>
          <span>Weekend</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-yellow-50 border border-gray-100 rounded"></div>
          <span>Festivo</span>
        </div>
      </div>

      {/* All family members summary */}
      {allFamilyAvailability.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold text-gray-700 mb-2">Riepilogo disponibilità familiari</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {allFamilyAvailability.slice(0, 10).map((item, idx) => (
              <div key={idx} className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                <span className={`w-2 h-2 rounded-full ${item.status === 'disponibile' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="font-medium">{(item.profiles as any)?.full_name}</span>
                <span>- {format(new Date(item.date), 'dd/MM')}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${item.status === 'disponibile' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.status === 'disponibile' ? `✓ ${item.start_time || ''}-${item.end_time || ''}` : '✗ Non disponibile'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: it })}
              {(isWeekend(selectedDate) || isItalianHoliday(selectedDate)) && (
                <span className="ml-2 text-sm font-normal text-purple-600">
                  {isItalianHoliday(selectedDate) ? '🎉 Festivo' : '📅 Weekend'}
                </span>
              )}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stato</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalStatus('disponibile')}
                    className={`flex-1 py-3 rounded-lg font-medium transition ${
                      modalStatus === 'disponibile'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Disponibile
                  </button>
                  <button
                    onClick={() => setModalStatus('non_disponibile')}
                    className={`flex-1 py-3 rounded-lg font-medium transition ${
                      modalStatus === 'non_disponibile'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ✗ Non disponibile
                  </button>
                </div>
              </div>

              {/* Orari - visibili solo se disponibile */}
              {modalStatus === 'disponibile' && (
                <>
                  {/* Preset orari rapidi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Orari rapidi</label>
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
                              ? 'bg-purple-500 text-white border-purple-500'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        🕐 Inizio disponibilità
                      </label>
                      <input
                        type="time"
                        value={modalStartTime}
                        onChange={(e) => setModalStartTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        🕐 Fine disponibilità
                      </label>
                      <input
                        type="time"
                        value={modalEndTime}
                        onChange={(e) => setModalEndTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                      />
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                    📅 Sarai disponibile dalle <strong>{modalStartTime}</strong> alle <strong>{modalEndTime}</strong>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (opzionale)</label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Aggiungi note..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Annulla
                </button>
                <button
                  onClick={saveAvailability}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  Salva
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
