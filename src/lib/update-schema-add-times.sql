-- ============================================
-- UPDATE SCHEMA: Aggiunge i campi orario
-- e rafforza la sicurezza degli inserimenti
-- ============================================
-- Esegui questo script se hai già creato il database
-- per aggiungere i campi start_time ed end_time
-- e per impedire la modifica degli inserimenti altrui
-- ============================================

-- Aggiunge i campi alla tabella badanti
ALTER TABLE caregiver_availability ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE caregiver_availability ADD COLUMN IF NOT EXISTS end_time TIME;

-- Aggiunge i campi alla tabella familiari
ALTER TABLE family_availability ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE family_availability ADD COLUMN IF NOT EXISTS end_time TIME;

-- ============================================
-- SICUREZZA: Impedisce a un membro di modificare
-- gli inserimenti di altri membri
-- ============================================

-- Rimuove le vecchie policies generiche
DROP POLICY IF EXISTS "Le badanti possono gestire la propria disponibilità" ON caregiver_availability;
DROP POLICY IF EXISTS "I familiari possono gestire la propria disponibilità" ON family_availability;

-- Crea policies specifiche per ogni operazione
-- BADANTI
CREATE POLICY "Le badanti possono inserire la propria disponibilità" ON caregiver_availability
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Le badanti possono modificare la propria disponibilità" ON caregiver_availability
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Le badanti possono eliminare la propria disponibilità" ON caregiver_availability
  FOR DELETE USING (auth.uid() = user_id);

-- FAMILIARI
CREATE POLICY "I familiari possono inserire la propria disponibilità" ON family_availability
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "I familiari possono modificare la propria disponibilità" ON family_availability
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "I familiari possono eliminare la propria disponibilità" ON family_availability
  FOR DELETE USING (auth.uid() = user_id);

-- Verifica che i campi siano stati aggiunti
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('caregiver_availability', 'family_availability')
  AND column_name IN ('start_time', 'end_time');

-- Verifica le policies create
SELECT policyname, cmd, qual IS NOT NULL as has_using, with_check IS NOT NULL as has_check
FROM pg_policies 
WHERE tablename IN ('caregiver_availability', 'family_availability')
ORDER BY tablename, policyname;
