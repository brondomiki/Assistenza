-- Imposta Brondomiki@gmail.com come superuser (amministratore)
UPDATE profiles 
SET role = 'superuser' 
WHERE email = 'brondomiki@gmail.com';

-- Verifica che l'aggiornamento sia stato effettuato
SELECT id, email, full_name, role 
FROM profiles 
WHERE email = 'brondomiki@gmail.com';
