-- Aggiorna le disponibilità delle badanti da 23:59 a 24:00
-- per coprire tutte le 24 ore complete senza gap di 1 minuto

UPDATE caregiver_availability
SET end_time = '24:00'
WHERE end_time = '23:59'
  AND status = 'disponibile';

-- Verifica quante righe sono state aggiornate
SELECT COUNT(*) as righe_aggiornate
FROM caregiver_availability
WHERE end_time = '24:00'
  AND status = 'disponibile';
