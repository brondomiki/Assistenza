# 🧹 Eliminazione Registrazioni Duplicate

## 📋 Panoramica

Questo documento spiega come eliminare le registrazioni duplicate dal database e come il sistema previene la creazione di nuovi duplicati.

---

## 🚨 Problema: Registrazioni Duplicate

### Cosa Sono i Duplicati?

Una registrazione è considerata duplicata quando ha gli stessi valori per:
- `user_id` (stesso utente)
- `date` (stesso giorno)
- `start_time` (stesso orario inizio)
- `end_time` (stesso orario fine)
- `status` (stesso stato: disponibile/non_disponibile)

### Perché Si Creano?

I duplicati possono crearsi a causa di:
- Bug nel codice precedente
- Inserimenti multipli accidentali
- Problemi di sincronizzazione
- Click multipli sul pulsante "Salva"

---

## 🛠️ Soluzione: Script SQL per Eliminare Duplicati

### File: `src/lib/remove-duplicates.sql`

Questo script SQL:
1. ✅ Identifica tutte le registrazioni duplicate
2. ✅ Mantiene solo la prima occorrenza (ID più basso)
3. ✅ Elimina tutte le copie duplicate
4. ✅ Aggiunge vincoli UNIQUE per prevenire duplicati futuri

### Come Eseguire lo Script

#### Passo 1: Accedi a Supabase

1. Vai su [https://supabase.com](https://supabase.com)
2. Accedi al tuo progetto
3. Vai su **SQL Editor** (icona nel menu laterale)

#### Passo 2: Copia lo Script

Apri il file `src/lib/remove-duplicates.sql` e copia tutto il contenuto.

#### Passo 3: Esegui lo Script

1. Incolla lo script nel SQL Editor
2. Clicca su **"Run"** (o premi Ctrl+Enter)
3. Attendi il completamento

#### Passo 4: Verifica il Risultato

Lo script restituirà un report con:
- Numero di duplicati eliminati da `caregiver_availability`
- Numero di duplicati eliminati da `family_availability`
- Conferma che i vincoli UNIQUE sono stati creati

**Risultato atteso:**
```
tabella                  | duplicati_rimasti
-------------------------|------------------
caregiver_availability   | 0
family_availability      | 0
```

---

## 🔒 Prevenzione Futura: Vincoli UNIQUE

### Cosa Sono i Vincoli UNIQUE?

I vincoli UNIQUE sono regole del database che impediscono l'inserimento di dati duplicati.

### Vincoli Aggiunti

Lo script aggiunge questi vincoli:

```sql
-- caregiver_availability
ALTER TABLE caregiver_availability
ADD CONSTRAINT caregiver_availability_unique_constraint 
UNIQUE (user_id, date, start_time, end_time, status);

-- family_availability
ALTER TABLE family_availability
ADD CONSTRAINT family_availability_unique_constraint 
UNIQUE (user_id, date, start_time, end_time, status);
```

### Cosa Significa?

Il database ora impedisce automaticamente:
- ❌ Inserimento di due disponibilità identiche nello stesso giorno
- ❌ Inserimento di due non disponibilità identiche nello stesso giorno
- ❌ Qualsiasi duplicato basato su user_id + date + start_time + end_time + status

---

## 🎯 Controllo Frontend: Doppia Protezione

### File Modificati

1. **`src/components/CaregiverCalendar.tsx`**
2. **`src/components/FamilyCalendar.tsx`**

### Cosa Fa il Controllo Frontend?

Prima di inviare i dati al database, il codice verifica:

```typescript
// Controlla se esiste già una registrazione identica (duplicato)
const isDuplicate = existingEntries.some(entry => 
  entry.status === modalStatus &&
  entry.start_time === modalStartTime &&
  entry.end_time === modalEndTime
);

if (isDuplicate) {
  alert('⚠️ Esiste già una registrazione identica per questo giorno e orario.');
  return;
}
```

### Vantaggi della Doppia Protezione

1. **Frontend**: Blocca immediatamente, mostra messaggio all'utente
2. **Database**: Sicurezza aggiuntiva, impedisce duplicati anche se il frontend fallisce

---

## 🧪 Test: Verifica che Funzioni

### Test 1: Elimina Duplicati Esistenti

1. Esegui lo script SQL
2. Controlla il report: tutti i duplicati dovrebbero essere 0
3. Vai nel calendario: non dovresti vedere barre sovrapposte

### Test 2: Prova a Creare un Duplicato

1. Accedi come badante
2. Clicca su un giorno
3. Inserisci disponibilità 08:00-12:00
4. Clicca di nuovo sullo stesso giorno
5. Prova a inserire di nuovo 08:00-12:00
6. **Risultato atteso**: Messaggio "Esiste già una registrazione identica"

### Test 3: Verifica Vincolo Database

1. Apri Supabase → SQL Editor
2. Esegui questa query:
```sql
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name IN ('caregiver_availability', 'family_availability');
```
3. **Risultato atteso**: Dovresti vedere i due vincoli UNIQUE creati

---

## 📊 Report: Cosa Fa lo Script

### Fase 1: Identificazione Duplicati

```sql
SELECT id,
       ROW_NUMBER() OVER (
         PARTITION BY user_id, date, start_time, end_time, status 
         ORDER BY id
       ) as row_num
FROM caregiver_availability
```

Questo query:
- Raggruppa le registrazioni per user_id + date + start_time + end_time + status
- Numera ogni gruppo (1, 2, 3, ...)
- La prima occorrenza ha `row_num = 1`
- I duplicati hanno `row_num > 1`

### Fase 2: Eliminazione Duplicati

```sql
DELETE FROM caregiver_availability
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (...) as row_num
    FROM caregiver_availability
  ) t
  WHERE t.row_num > 1
);
```

Questo elimina tutte le registrazioni con `row_num > 1` (cioè i duplicati).

### Fase 3: Aggiunta Vincoli UNIQUE

```sql
ALTER TABLE caregiver_availability
ADD CONSTRAINT caregiver_availability_unique_constraint 
UNIQUE (user_id, date, start_time, end_time, status);
```

Questo impedisce futuri duplicati a livello di database.

---

## 🔍 Troubleshooting

### Problema: "Errore durante l'esecuzione dello script"

**Causa**: Potrebbero esserci già vincoli UNIQUE con lo stesso nome.

**Soluzione**: Esegui prima questo script per rimuovere i vincoli esistenti:
```sql
ALTER TABLE caregiver_availability
DROP CONSTRAINT IF EXISTS caregiver_availability_unique_constraint;

ALTER TABLE family_availability
DROP CONSTRAINT IF EXISTS family_availability_unique_constraint;
```

Poi riesegui lo script completo.

### Problema: "Ancora vedo duplicati dopo l'esecuzione"

**Causa**: Il browser ha ancora la cache vecchia.

**Soluzione**:
1. Svuota la cache del browser (Ctrl+Shift+R)
2. Ricarica la pagina
3. Controlla di nuovo il calendario

### Problema: "Non posso inserire nuove disponibilità"

**Causa**: Il vincolo UNIQUE sta bloccando inserimenti legittimi.

**Soluzione**: Verifica che non stai cercando di inserire una registrazione identica. Se è un caso legittimo, controlla che gli orari siano diversi.

---

## 📝 Note Importanti

### Cosa Mantiene lo Script

- ✅ Mantiene la **prima occorrenza** (ID più basso) di ogni gruppo di duplicati
- ✅ Preserva tutte le note e i metadati della prima occorrenza
- ✅ Non modifica le registrazioni non duplicate

### Cosa Elimina lo Script

- ❌ Elimina tutte le copie duplicate (ID più alti)
- ❌ Non recupera le note delle copie eliminate
- ❌ Non può essere annullato (fai un backup prima!)

### Backup Prima di Eseguire

Prima di eseguire lo script, fai un backup:

1. Vai su Supabase → Database → Backups
2. Crea un nuovo backup
3. Attendi il completamento
4. Poi esegui lo script

---

## 🎯 Checklist Finale

- [ ] Script SQL eseguito con successo
- [ ] Nessun duplicato rimasto (report mostra 0)
- [ ] Vincoli UNIQUE creati correttamente
- [ ] Test frontend: messaggio di errore su tentativo di duplicato
- [ ] Cache del browser svuotata
- [ ] Calendari visualizzati correttamente
- [ ] Nessun dato perso durante l'eliminazione

---

## 📚 Riferimenti

- **Script SQL**: `src/lib/remove-duplicates.sql`
- **Codice Frontend**: 
  - `src/components/CaregiverCalendar.tsx` (linea ~350)
  - `src/components/FamilyCalendar.tsx` (linea ~280)
- **Documentazione Supabase**: [Constraints](https://supabase.com/docs/guides/database/constraints)

---

## ✅ Risultato Finale

Dopo aver eseguito lo script:
- ✅ Nessun duplicato nel database
- ✅ Vincoli UNIQUE attivi
- ✅ Frontend blocca tentativi di duplicati
- ✅ Sistema protetto su due livelli (frontend + database)
- ✅ Calendari puliti e corretti
