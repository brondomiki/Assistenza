-- ============================================
-- AGGIORNAMENTO SCHEMA: Permettere multiple entry per giorno
-- ============================================
-- Rimuove il vincolo UNIQUE per permettere più intervalli orari
-- nello stesso giorno (es: disponibile 00:00-14:00 e 16:00-24:00)
-- ============================================

-- Rimuovi il vincolo UNIQUE da caregiver_availability
ALTER TABLE caregiver_availability DROP CONSTRAINT IF EXISTS caregiver_availability_user_id_date_key;

-- Rimuovi il vincolo UNIQUE da family_availability
ALTER TABLE family_availability DROP CONSTRAINT IF EXISTS family_availability_user_id_date_key;

-- Verifica che i vincoli siano stati rimossi
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('caregiver_availability', 'family_availability')
  AND tc.constraint_type = 'UNIQUE';
