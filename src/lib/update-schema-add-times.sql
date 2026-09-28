-- ============================================
-- UPDATE SCHEMA: Aggiunge i campi orario
-- Esegui questo script se hai già creato il database
-- e vuoi aggiungere i campi start_time ed end_time
-- ============================================

-- Aggiunge i campi alla tabella badanti
ALTER TABLE caregiver_availability ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE caregiver_availability ADD COLUMN IF NOT EXISTS end_time TIME;

-- Aggiunge i campi alla tabella familiari
ALTER TABLE family_availability ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE family_availability ADD COLUMN IF NOT EXISTS end_time TIME;

-- Verifica che i campi siano stati aggiunti
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('caregiver_availability', 'family_availability')
  AND column_name IN ('start_time', 'end_time');
