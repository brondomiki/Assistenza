-- ============================================
-- ELIMINAZIONE REGISTRAZIONI DUPLICATE
-- ============================================
-- Questo script identifica e rimuove le registrazioni duplicate
-- mantenendo solo la prima occorrenza (quella con ID più basso)
-- ============================================

-- 1. Elimina duplicati da caregiver_availability
DELETE FROM caregiver_availability
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, date, start_time, end_time, status 
             ORDER BY id
           ) as row_num
    FROM caregiver_availability
  ) t
  WHERE t.row_num > 1
);

-- 2. Elimina duplicati da family_availability
DELETE FROM family_availability
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, date, start_time, end_time, status 
             ORDER BY id
           ) as row_num
    FROM family_availability
  ) t
  WHERE t.row_num > 1
);

-- 3. Verifica che non ci siano più duplicati
SELECT 'caregiver_availability' as tabella, 
       COUNT(*) as duplicati_rimasti
FROM (
  SELECT user_id, date, start_time, end_time, status, COUNT(*) as count
  FROM caregiver_availability
  GROUP BY user_id, date, start_time, end_time, status
  HAVING COUNT(*) > 1
) t
UNION ALL
SELECT 'family_availability' as tabella, 
       COUNT(*) as duplicati_rimasti
FROM (
  SELECT user_id, date, start_time, end_time, status, COUNT(*) as count
  FROM family_availability
  GROUP BY user_id, date, start_time, end_time, status
  HAVING COUNT(*) > 1
) t;

-- Dovrebbe restituire 0 duplicati per entrambe le tabelle

-- ============================================
-- PREVENZIONE DUPLICATI FUTURI
-- ============================================
-- Aggiungi vincoli UNIQUE per prevenire duplicati futuri
-- ============================================

-- 4. Aggiungi vincolo UNIQUE a caregiver_availability
ALTER TABLE caregiver_availability
ADD CONSTRAINT caregiver_availability_unique_constraint 
UNIQUE (user_id, date, start_time, end_time, status);

-- 5. Aggiungi vincolo UNIQUE a family_availability
ALTER TABLE family_availability
ADD CONSTRAINT family_availability_unique_constraint 
UNIQUE (user_id, date, start_time, end_time, status);

-- 6. Verifica che i vincoli siano stati creati
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name IN ('caregiver_availability', 'family_availability')
ORDER BY tc.table_name, tc.constraint_name;
