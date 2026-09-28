# Guida Setup Completo - Assistenza Anziani

## Passo 1: Creare il progetto Supabase

1. Vai su https://supabase.com e crea un account (o accedi)
2. Crea un nuovo progetto
3. Annota:
   - **Project URL** (es: `https://abcdefgh.supabase.co`)
   - **Anon/Public Key** (trovato in Settings > API)

## Passo 2: Configurare il Database

1. Nel dashboard di Supabase, vai su **SQL Editor**
2. Copia TUTTO il contenuto del file `src/lib/database-schema.sql`
3. Incolla nell'editor SQL e clicca **Run**
4. Verifica che le tabelle siano state create in **Table Editor**

## Passo 3: Configurare l'Autenticazione

1. Vai su **Authentication > Providers**
2. Assicurati che **Email** sia abilitato
3. **IMPORTANTE**: Disabilita "Confirm email" per permettere la registrazione senza conferma email
   - Vai su **Authentication > Providers > Email**
   - Trova l'opzione "Confirm email" e disabilitala
   - Salva le modifiche
4. Vai su **Authentication > URL Configuration** e imposta il Site URL al tuo dominio Vercel

## Passo 4: Configurare le variabili d'ambiente

### Per sviluppo locale:
Crea un file `.env.local` nella root del progetto:
```
VITE_SUPABASE_URL=https://tuoprogetto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### Per Vercel:
1. Vai nel dashboard di Vercel > Settings > Environment Variables
2. Aggiungi:
   - `VITE_SUPABASE_URL` = il tuo URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = la tua anon key

## Passo 5: Impostare il Superuser

Dopo aver registrato il tuo account tramite l'app:

1. Vai su **SQL Editor** in Supabase
2. Esegui:
```sql
UPDATE profiles SET role = 'superuser' WHERE email = 'tua-email@esempio.it';
```

## Passo 6: Configurare le Notifiche Email

### Opzione A: Usare Resend (consigliato)

1. Crea un account su https://resend.com
2. Verifica il tuo dominio o usa il sandbox
3. Ottieni l'API Key
4. In Supabase, vai su **Edge Functions > Secrets**
5. Aggiungi:
   - `RESEND_API_KEY` = la tua chiave Resend
   - `FROM_EMAIL` = email mittente (es: noreply@tuodominio.it)
   - `APP_URL` = URL della tua app su Vercel
6. Deploy della Edge Function (vedi sotto)

### Opzione B: Usare Supabase Auth Email

Le email di conferma registrazione sono già gestite da Supabase Auth.
Puoi personalizzare i template in **Authentication > Email Templates**.

## Passo 7: Deploy su Vercel

1. Push del codice su GitHub/GitLab
2. Vai su https://vercel.com e importa il repository
3. Framework: Vite
4. Aggiungi le variabili d'ambiente (Passo 4)
5. Clicca Deploy

## Passo 8: Deploy Edge Function per notifiche

```bash
# Installa Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al progetto
supabase link --project-ref tuo-project-id

# Deploy della function
supabase functions deploy send-notification-email

# Per chiamare la function dall'app, aggiungi nel codice:
# await supabase.functions.invoke('send-notification-email', {
#   body: { message: '...', exclude_user_id: user.id }
# })
```

## Passo 9: Configurare il Trigger per le Email

Per inviare automaticamente le email quando viene inserita una notifica,
crea un webhook in Supabase:

1. Vai su **Database > Webhooks**
2. Crea un nuovo webhook sulla tabella `notifications`
3. Evento: INSERT
4. URL: l'URL della tua Edge Function

## Verifica Finale

1. Apri l'app su Vercel
2. Registrati come badante
3. Registrati come familiare (da un altro browser/incognito)
4. Imposta il primo utente come superuser
5. Modifica la disponibilità e verifica che appaiano le notifiche
6. Verifica che arrivino le email (se configurate)

## Troubleshooting

- **Errore "relation does not exist"**: Esegui di nuovo lo schema SQL
- **Login non funziona**: Verifica che l'Email provider sia attivo
- **Notifiche non arrivano**: Controlla i logs della Edge Function
- **Calendario vuoto**: Verifica le RLS policies nel database
