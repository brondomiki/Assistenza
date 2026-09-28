# 🚧 Funzionalità Future - Multiple Fasce Orarie

## Funzionalità Richiesta

Permettere alla badante di inserire **multiple fasce orarie** nello stesso giorno.

### Esempio
- Badante disponibile 00:00-24:00 (precompilato)
- Non può dalle 14:00 alle 16:00
- Risultato atteso: disponibile 00:00-14:00 e 16:00-24:00

## Stato Attuale

Il modello dati attuale prevede **una sola entry per giorno** (vincolo UNIQUE su user_id + date).

## Soluzione Implementata (Workaround)

### Opzione 1: Modalità Manuale
La badante può:
1. Rimuovere la disponibilità automatica per quel giorno
2. Inserire manualmente le fasce orarie desiderate:
   - Disponibile 00:00-14:00
   - Disponibile 16:00-24:00

**Limitazione**: richiede 2 inserimenti manuali

### Opzione 2: Non Disponibilità Parziale
La badante può:
1. Inserire "non disponibile" per l'intero giorno
2. Poi inserire manualmente le fasce di disponibilità

**Limitazione**: più macchinoso

## Soluzione Futura (Richiede Sviluppo)

### Cambio Modello Dati

1. **Rimuovere vincolo UNIQUE**:
```sql
ALTER TABLE caregiver_availability DROP CONSTRAINT caregiver_availability_user_id_date_key;
ALTER TABLE family_availability DROP CONSTRAINT family_availability_user_id_date_key;
```

2. **Permettere multiple entry per giorno**:
- Ogni entry rappresenta un intervallo orario
- Esempio per un giorno:
  - Entry 1: disponibile 00:00-14:00
  - Entry 2: non_disponibile 14:00-16:00
  - Entry 3: disponibile 16:00-24:00

3. **Logica di "taglio" automatica**:
Quando l'utente inserisce una non disponibilità in un intervallo esistente:
- Il sistema calcola automaticamente gli intervalli risultanti
- Crea le entry necessarie
- Esempio:
  - Esiste: disponibile 00:00-24:00
  - Utente inserisce: non disponibile 14:00-16:00
  - Sistema crea:
    - disponibile 00:00-14:00
    - non_disponibile 14:00-16:00
    - disponibile 16:00-24:00

4. **UI aggiornata**:
- Mostrare tutti gli intervalli per ogni giorno
- Permettere aggiunta/rimozione di intervalli
- Visualizzazione grafica delle fasce orarie

### Stima Sviluppo
- Tempo stimato: 4-6 ore
- Complessità: Media-Alta
- Priorità: Media

## Script SQL Pronto

Il file `src/lib/update-schema-multiple-slots.sql` contiene già lo script per rimuovere i vincoli UNIQUE.

Per attivarlo:
```bash
# Nel SQL Editor di Supabase, esegui:
# src/lib/update-schema-multiple-slots.sql
```

## Note

Questa funzionalità è stata identificata come miglioramento futuro. Il sistema attuale funziona correttamente con il modello a singola entry per giorno.
