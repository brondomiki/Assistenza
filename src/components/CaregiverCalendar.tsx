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

export default function CaregiverCalendar() {
  const { user, profile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, { status: string; notes?: string; start_time?: string; end_time?: string }>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalStatus, setModalStatus] = useState<'disponibile' | 'non_disponibile'>('disponibile');
  const [modalNotes, setModalNotes] = useState('');
  const [modalStartTime, setModalStartTime] = useState('08:00');
  const [modalEndTime, setModalEndTime] = useState('17:00');
  const [showModal, setShowModal] = useState(false);
  const [allCaregiverAvailability, setAllCaregiverAvailability] = useState<any[]>([]);
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
      .from('caregiver_availability')
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
      .from('caregiver_availability')
      .select('*, profiles(full_name)')
      .gte('date', monthStart)
      .lte('date', monthEnd);

    if (data) {
      setAllCaregiverAvailability(data);
    }
  }

  async function handleDayClick(date: Date) {
    if (!isSameMonth(date, currentMonth)) return;
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = availability[dateStr];
    setModalStatus(existing?.status === 'non_disponibile' ? 'non_disponibile' : 'disponibile');
    setModalNotes(existing?.notes || '');
    setModalStartTime(existing?.start_time || '08:00');
    setModalEndTime(existing?.end_time || '17:00');
    setShowModal(true);
  }

  async function saveAvailability() {
    if (!selectedDate || !user) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const timeInfo = `dalle ${modalStartTime} alle ${modalEndTime}`;

    const { error } = await supabase.from('caregiver_availability').upsert({
      user_id: user.id,
      date: dateStr,
      status: modalStatus,
      start_time: modalStartTime,
      end_time: modalEndTime,
      notes: modalNotes || null,
    });

    if (!error) {
      await sendNotification(
        `${profile?.full_name} ha aggiornato la propria disponibilità per il ${format(selectedDate, 'dd/MM/yyyy')}: ${modalStatus === 'disponibile' ? `Disponibile ${timeInfo}` : 'Non disponibile'}`
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
      .from('caregiver_availability')
      .delete()
      .eq('user_id', user.id)
      .eq('date', dateStr);

    if (!error) {
      await sendNotification(
        `${profile?.full_name} ha RIMOSSO la propria disponibilità per il ${format(selectedDate, 'dd/MM/yyyy')}`
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

  // Preset orari rapidi
  const timePresets = [
    { label: 'Mattina (8-13)', start: '08:00', end: '13:00' },
    { label: 'Pomeriggio (13-18)', start: '13:00', end: '18:00' },
    { label: 'Giornata (8-17)', start: '08:00', end: '17:00' },
    { label: 'Intera giornata (8-20)', start: '08:00', end: '20:00' },
    { label: 'Notte (20-8)', start: '20:00', end: '08:00' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">👩‍⚕️</span> Calendario Badanti
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

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              disabled={!isCurrentMonth}
              className={`
                relative p-2 min-h-[75px] rounded-lg text-sm transition border
                ${!isCurrentMonth ? 'opacity-30 cursor-default' : 'hover:border-indigo-300 cursor-pointer'}
                ${dayIsToday ? 'border-indigo-500 border-2' : 'border-gray-100'}
                ${dayIsWeekend && isCurrentMonth ? 'bg-orange-50' : ''}
                ${myAvail?.status === 'disponibile' ? 'bg-green-100 border-green-300' : ''}
                ${myAvail?.status === 'non_disponibile' ? 'bg-red-100 border-red-300' : ''}
              `}
            >
              <span className={`font-medium ${dayIsToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </span>
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
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span>Disponibile</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span>Non disponibile</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-orange-50 border border-gray-100 rounded"></div>
          <span>Weekend</span>
        </div>
      </div>

      {/* All caregivers summary */}
      {allCaregiverAvailability.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold text-gray-700 mb-2">Riepilogo disponibilità badanti</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {allCaregiverAvailability.slice(0, 10).map((item, idx) => (
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
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: it })}
            </h3>

            {/* Banner: disponibilità esistente */}
            {selectedDate && availability[format(selectedDate, 'yyyy-MM-dd')] && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                <span className="text-lg">ℹ️</span>
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Hai già inserito una disponibilità per questo giorno</p>
                  <p className="text-amber-700 mt-0.5">
                    Puoi modificarla qui sotto oppure rimuoverla completamente con il pulsante in fondo.
                  </p>
                </div>
              </div>
            )}

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

              {/* Orari - sempre visibili */}
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
                            ? 'bg-indigo-500 text-white border-indigo-500'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
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
                      🕐 Inizio
                    </label>
                    <input
                      type="time"
                      value={modalStartTime}
                      onChange={(e) => setModalStartTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🕐 Fine
                    </label>
                    <input
                      type="time"
                      value={modalEndTime}
                      onChange={(e) => setModalEndTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                    />
                  </div>
                </div>

                <div className={`border rounded-lg p-3 text-sm ${
                  modalStatus === 'disponibile' 
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  📅 {modalStatus === 'disponibile' ? 'Sarai disponibile' : 'Non sarai disponibile'} dalle <strong>{modalStartTime}</strong> alle <strong>{modalEndTime}</strong>
                </div>
              </>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (opzionale)</label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  placeholder="Aggiungi note..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={saveAvailability}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                  >
                    💾 Salva
                  </button>
                </div>
                
                {/* Pulsante Rimuovi - visibile solo se c'è già una disponibilità */}
                {selectedDate && availability[format(selectedDate, 'yyyy-MM-dd')] && (
                  <button
                    onClick={removeAvailability}
                    className="w-full py-3 bg-red-50 border-2 border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-100 transition flex items-center justify-center gap-2"
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
