# 🚀 Implementazione Multiple Fasce Orarie

## Stato: PRONTO PER IMPLEMENTAZIONE

Questa funzionalità richiede modifiche al database e al frontend.

## ✅ Passo 1: Aggiorna il Database (GIÀ PRONTO)

Esegui questo script nel **SQL Editor** di Supabase:

```sql
-- File: src/lib/update-schema-multiple-slots.sql

-- Rimuovi il vincolo UNIQUE da caregiver_availability
ALTER TABLE caregiver_availability DROP CONSTRAINT IF EXISTS caregiver_availability_user_id_date_key;

-- Rimuovi il vincolo UNIQUE da family_availability  
ALTER TABLE family_availability DROP CONSTRAINT IF EXISTS family_availability_user_id_date_key;
```

Questo permette multiple entry per lo stesso giorno.

## 📝 Passo 2: Modifiche al Frontend (DA IMPLEMENTARE)

### Cambio Struttura Dati

**File**: `src/components/CaregiverCalendar.tsx`

Cambia il tipo di `availability`:

```typescript
// DA:
const [availability, setAvailability] = useState<Record<string, { 
  status: string; 
  notes?: string; 
  start_time?: string; 
  end_time?: string; 
}>>({});

// A:
const [availability, setAvailability] = useState<Record<string, Array<{
  id: string;
  status: string;
  notes?: string;
  start_time?: string;
  end_time?: string;
}>>>({});
```

### Aggiorna `fetchMyAvailability`

```typescript
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
    // Raggruppa tutte le entry per data
    const map: Record<string, Array<{ id: string; status: string; notes?: string; start_time?: string; end_time?: string }>> = {};
    data.forEach((item) => {
      if (!map[item.date]) {
        map[item.date] = [];
      }
      map[item.date].push({
        id: item.id,
        status: item.status,
        notes: item.notes,
        start_time: item.start_time,
        end_time: item.end_time,
      });
    });
    setAvailability(map);
  }
  setLoading(false);
}
```

### Logica di Split Automatico

Quando l'utente inserisce una non disponibilità in un intervallo esistente:

```typescript
function calculateSplitIntervals(
  existingIntervals: Array<{ start_time: string; end_time: string; status: string }>,
  newInterval: { start_time: string; end_time: string; status: string }
): Array<{ start_time: string; end_time: string; status: string }> {
  
  // Converti orari in minuti per facilitare i calcoli
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const newStart = timeToMinutes(newInterval.start_time);
  const newEnd = timeToMinutes(newInterval.end_time);
  
  const result: Array<{ start_time: string; end_time: string; status: string }> = [];
  
  existingIntervals.forEach(interval => {
    const intStart = timeToMinutes(interval.start_time);
    const intEnd = timeToMinutes(interval.end_time);
    
    // Se non c'è sovrapposizione, mantieni l'intervallo originale
    if (newEnd <= intStart || newStart >= intEnd) {
      result.push(interval);
      return;
    }
    
    // Se c'è sovrapposizione, calcola le parti rimanenti
    // Parte prima della sovrapposizione
    if (intStart < newStart) {
      const hours = Math.floor(intStart / 60).toString().padStart(2, '0');
      const mins = (intStart % 60).toString().padStart(2, '0');
      const endHours = Math.floor(newStart / 60).toString().padStart(2, '0');
      const endMins = (newStart % 60).toString().padStart(2, '0');
      
      result.push({
        start_time: `${hours}:${mins}`,
        end_time: `${endHours}:${endMins}`,
        status: interval.status
      });
    }
    
    // Parte dopo la sovrapposizione
    if (intEnd > newEnd) {
      const hours = Math.floor(newEnd / 60).toString().padStart(2, '0');
      const mins = (newEnd % 60).toString().padStart(2, '0');
      const endHours = Math.floor(intEnd / 60).toString().padStart(2, '0');
      const endMins = (intEnd % 60).toString().padStart(2, '0');
      
      result.push({
        start_time: `${hours}:${mins}`,
        end_time: `${endHours}:${endMins}`,
        status: interval.status
      });
    }
  });
  
  // Aggiungi il nuovo intervallo
  result.push(newInterval);
  
  return result;
}
```

### Aggiorna `saveAvailability`

```typescript
async function saveAvailability() {
  if (!selectedDate || !user) return;
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const existingEntries = availability[dateStr] || [];
  
  // Se è una non disponibilità, calcola lo split automatico
  if (modalStatus === 'non_disponibile' && existingEntries.length > 0) {
    const newInterval = {
      start_time: modalStartTime,
      end_time: modalEndTime,
      status: 'non_disponibile'
    };
    
    const splitIntervals = calculateSplitIntervals(
      existingEntries.map(e => ({
        start_time: e.start_time || '00:00',
        end_time: e.end_time || '23:59',
        status: e.status
      })),
      newInterval
    );
    
    // Elimina tutte le entry esistenti per questo giorno
    await supabase
      .from('caregiver_availability')
      .delete()
      .eq('user_id', user.id)
      .eq('date', dateStr);
    
    // Inserisci le nuove entry risultanti dallo split
    const newEntries = splitIntervals.map(interval => ({
      user_id: user.id,
      date: dateStr,
      status: interval.status,
      start_time: interval.start_time,
      end_time: interval.end_time,
      notes: interval.status === 'non_disponibile' ? modalNotes : null,
    }));
    
    await supabase.from('caregiver_availability').insert(newEntries);
  } else {
    // Comportamento normale: aggiungi una nuova entry
    await supabase.from('caregiver_availability').insert({
      user_id: user.id,
      date: dateStr,
      status: modalStatus,
      start_time: modalStartTime,
      end_time: modalEndTime,
      notes: modalNotes || null,
    });
  }
  
  await sendNotification(
    `${profile?.full_name} ha aggiornato la disponibilità per il ${format(selectedDate, 'dd/MM/yyyy')}`
  );
  
  setShowModal(false);
  fetchMyAvailability();
  fetchAllAvailability();
}
```

### Aggiorna UI nel Modal

Mostra tutte le fasce orarie esistenti:

```typescript
{/* Mostra fasce orarie esistenti */}
{selectedDate && availability[format(selectedDate, 'yyyy-MM-dd')]?.length > 0 && (
  <div className="bg-gray-800 rounded-lg p-4 mb-4">
    <h4 className="text-sm font-medium text-gray-300 mb-2">Fasce orarie esistenti:</h4>
    <div className="space-y-2">
      {availability[format(selectedDate, 'yyyy-MM-dd')].map((entry, idx) => (
        <div key={entry.id || idx} className="flex items-center justify-between bg-gray-700 rounded p-2">
          <span className="text-sm text-gray-200">
            {entry.start_time} - {entry.end_time}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            entry.status === 'disponibile' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {entry.status === 'disponibile' ? '✓ Disponibile' : '✗ Non disponibile'}
          </span>
        </div>
      ))}
    </div>
  </div>
)}
```

### Aggiorna Visualizzazione nel Calendario

```typescript
{/* Mostra tutte le fasce orarie */}
{dayEntries.length > 0 && (
  <div className="mt-1 space-y-0.5">
    {dayEntries.slice(0, 3).map((entry, i) => (
      <div key={entry.id || i} className={`text-[9px] font-medium leading-tight truncate ${
        entry.status === 'disponibile' ? 'text-green-300' : 'text-red-300'
      }`}>
        {entry.start_time && entry.end_time ? `${entry.start_time}-${entry.end_time}` : ''}
      </div>
    ))}
    {dayEntries.length > 3 && (
      <div className="text-[9px] text-gray-400">+{dayEntries.length - 3} altre</div>
    )}
  </div>
)}
```

## 🧪 Testing

Dopo l'implementazione, testa questi scenari:

1. **Split automatico**:
   - Badante disponibile 00:00-24:00
   - Inserisce non disponibile 14:00-16:00
   - Risultato atteso: 00:00-14:00 (disponibile), 14:00-16:00 (non disponibile), 16:00-24:00 (disponibile)

2. **Multiple non disponibilità**:
   - Inserisce non disponibile 10:00-12:00
   - Poi inserisce non disponibile 15:00-17:00
   - Risultato: 3 fasce disponibili separate da 2 fasce non disponibili

3. **Rimozione fasce**:
   - Può rimuovere singole fasce orarie
   - Il sistema mantiene le altre fasce

## 📊 Stima

- **Tempo di implementazione**: 3-4 ore
- **Complessità**: Media
- **Rischio**: Basso (logica ben definita)

## 🎯 Priorità

**ALTA** - Questa funzionalità è essenziale per una gestione flessibile della disponibilità.
