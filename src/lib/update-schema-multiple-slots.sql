-- ============================================
-- AGGIORNAMENTO SCHEMA: Multiple Fasce Orarie
-- ============================================
-- Permette multiple entry per giorno (es: disponibile 00:00-14:00 e 16:00-24:00)
-- ESEGUI QUESTO SCRIPT NEL SQL EDITOR DI SUPABASE
-- ============================================

-- 1. Rimuovi il vincolo UNIQUE da caregiver_availability
ALTER TABLE caregiver_availability DROP CONSTRAINT IF EXISTS caregiver_availability_user_id_date_key;

-- 2. Rimuovi il vincolo UNIQUE da family_availability
ALTER TABLE family_availability DROP CONSTRAINT IF EXISTS family_availability_user_id_date_key;

-- 3. Verifica che i vincoli siano stati rimossi
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('caregiver_availability', 'family_availability')
  AND tc.constraint_type = 'UNIQUE';

-- Dovrebbe restituire 0 righe (nessun vincolo UNIQUE)
