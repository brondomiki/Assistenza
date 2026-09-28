-- ============================================
-- ELIMINAZIONE COMPLETA UTENTE
-- ============================================
-- Esegui questo script per eliminare completamente un utente
-- da entrambe le tabelle (auth.users e profiles)
-- ============================================

-- Sostituisci l'email qui sotto con quella dell'utente da eliminare
DO $$
DECLARE
  user_id_to_delete UUID;
BEGIN
  -- Trova l'ID dell'utente dall'email
  SELECT id INTO user_id_to_delete 
  FROM auth.users 
  WHERE email = 'milagro@gmail.com';
  
  -- Se l'utente esiste, eliminalo
  IF user_id_to_delete IS NOT NULL THEN
    -- Elimina dalla tabella auth.users (cascade eliminerà anche profiles)
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    
    RAISE NOTICE 'Utente eliminato con successo: %', user_id_to_delete;
  ELSE
    RAISE NOTICE 'Utente non trovato con questa email';
  END IF;
END $$;

-- Verifica che l'utente sia stato eliminato
SELECT 
  'auth.users' as tabella,
  COUNT(*) as record
FROM auth.users 
WHERE email = 'milagro@gmail.com'
UNION ALL
SELECT 
  'profiles' as tabella,
  COUNT(*) as record
FROM profiles 
WHERE email = 'milagro@gmail.com';
