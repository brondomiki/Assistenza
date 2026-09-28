# 📋 GUIDA COMPLETA: Configurazione Variabili d'Ambiente - Assistenza Anziani

Questa guida ti spiega passo-passo come ottenere e configurare tutte le chiavi necessarie per il portale "Assistenza Anziani".

---

## 🎯 COSA SONO LE VARIABILI D'AMBIENTE?

Le variabili d'ambiente sono "segreti" (chiavi API, URL, password) che l'applicazione usa per connettersi ai servizi esterni. Non vanno MAI pubblicate su GitHub.

Il file `.env.local` contiene queste variabili e viene letto automaticamente da Vite durante lo sviluppo.

---

## 🔑 PASSO 1: Ottenere le chiavi Supabase

### 1.1 Crea un account Supabase
- Vai su https://supabase.com
- Clicca "Start your project"
- Accedi con GitHub o crea un account email

### 1.2 Crea un nuovo progetto
- Clicca "New Project"
- Compila:
  - **Name**: Assistenza Anziani (o quello che preferisci)
  - **Database Password**: scegli una password sicura (ANNOTATELA!)
  - **Region**: West EU (Irlanda) - il più vicino all'Italia
- Clicca "Create new project"
- Attendi 1-2 minuti che il progetto sia pronto

### 1.3 Disabilita la conferma email

**IMPORTANTE**: Per permettere la registrazione senza conferma email:

1. Nel menu a sinistra, clicca su **Authentication** (icona lucchetto 🔒)
2. Clicca su **Providers** nel sottomenu
3. Clicca su **Email**
4. Trova l'opzione **"Confirm email"** e **DISABILITALA** (toggle su OFF)
5. Clicca **Save**

In questo modo, quando un utente si registra, verrà automaticamente loggato senza dover confermare l'email.

### 1.4 Trova le chiavi API
Una volta che il progetto è pronto:

1. Nel menu a sinistra, clicca su **"Settings"** (l'ingranaggio ⚙️)
2. Clicca su **"API"** nel sottomenu
3. Vedrai una pagina con queste informazioni:

```
┌─────────────────────────────────────────────────────────┐
│  Project URL:                                           │
│  https://xxxxxxxxxxxx.supabase.co          ← COPIA QUESTO
│                                                         │
│  Project API keys:                                      │
│                                                         │
│  anon public                                            │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← COPIA QUESTO
│                                                         │
│  service_role (secret)                                  │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← PER EDGE FUNCTIONS
└─────────────────────────────────────────────────────────┘
```

4. Copia:
   - **Project URL** → sarà il tuo `VITE_SUPABASE_URL`
   - **anon public key** → sarà il tuo `VITE_SUPABASE_ANON_KEY`

---

## 📧 PASSO 2: Configurare le Email con Resend

### 2.1 Crea un account Resend
- Vai su https://resend.com
- Registrati (piano gratuito: 100 email/giorno, 3.000/mese)

### 2.2 Ottieni la API Key
1. Dopo il login, vai su https://resend.com/api-keys
2. Clicca "Create API Key"
3. Dai un nome (es: "Assistenza Anziani")
4. Copia la chiave (inizia con `re_...`)

### 2.3 Verifica il dominio (opzionale per test)
- Per test puoi usare il dominio sandbox: `onboarding@resend.dev`
- Per produzione, aggiungi e verifica il tuo dominio in Resend

---

## 📝 PASSO 3: Creare il file .env.local

### 3.1 Per sviluppo LOCALE (sul tuo computer)

Nella root del progetto, crea un file chiamato `.env.local` con questo contenuto:

```env
# ============================================
# FILE: .env.local
# Posizione: root del progetto (stesso livello di package.json)
# ============================================

# --- SUPABASE ---
# Trovato in: Supabase Dashboard > Settings > API > Project URL
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Trovato in: Supabase Dashboard > Settings > API > anon public key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjIwMTU1NzU5OTl9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# --- RESEND (per email) ---
# Trovato in: https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email mittente (deve essere verificata su Resend o usa il sandbox)
FROM_EMAIL=noreply@tuodominio.it

# URL della tua app (per i link nelle email)
APP_URL=http://localhost:5173
```

### 3.2 Esempio REALISTICO

```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTU3NTk5OX0.ABcDeFgHiJkLmNoPqRsTuVwXyZ1234567890
RESEND_API_KEY=re_AbCdEfGh1234567890AbCdEfGh
FROM_EMAIL=care@famigliarossi.it
APP_URL=http://localhost:5173
```

---

## 🌐 PASSO 4: Configurare su VERCEL (per produzione)

Quando deployi su Vercel, il file `.env.local` NON viene caricato. Devi inserire le variabili manualmente nel dashboard di Vercel.

### 4.1 Deploy iniziale
1. Vai su https://vercel.com
2. Clicca "Add New..." > "Project"
3. Importa il tuo repository GitHub
4. Vercel rileva automaticamente che è un progetto Vite
5. Clicca "Deploy"

### 4.2 Aggiungi le variabili d'ambiente su Vercel
1. Nel progetto Vercel, vai su **Settings** > **Environment Variables**
2. Aggiungi UNA PER UNA queste variabili:

```
┌──────────────────────────────────────────────────────────────┐
│  Name                    │  Value              │ Environment │
├──────────────────────────────────────────────────────────────┤
│  VITE_SUPABASE_URL       │  https://xxx.supabase.co  │ All     │
│  VITE_SUPABASE_ANON_KEY  │  eyJhbGci...          │ All     │
│  RESEND_API_KEY          │  re_AbCdEf...         │ All     │
│  FROM_EMAIL              │  care@tuodominio.it   │ All     │
│  APP_URL                 │  https://tuosito.vercel.app │ All │
└──────────────────────────────────────────────────────────────┘
```

**⚠️ IMPORTANTE:** 
- Le variabili che iniziano con `VITE_` sono accessibili dal browser (frontend)
- Le altre (`RESEND_API_KEY`, `FROM_EMAIL`) sono solo sul server (Edge Functions)
- Seleziona "All" per renderle disponibili in Production, Preview e Development

### 4.3 Dopo aver aggiunto le variabili
- Vai su **Deployments**
- Clicca i tre puntini `...` dell'ultimo deployment
- Clicca **"Redeploy"** per applicare le nuove variabili

---

## 🗄️ PASSO 5: Eseguire lo Schema SQL su Supabase

1. Nel dashboard Supabase, clicca su **"SQL Editor"** (icona nel menu a sinistra)
2. Clicca **"New query"**
3. Apri il file `src/lib/database-schema.sql` nel tuo editor
4. Copia TUTTO il contenuto
5. Incolla nel SQL Editor di Supabase
6. Clicca **"Run"** (o premi Ctrl+Enter)
7. Verifica in "Table Editor" che le tabelle siano state create:
   - ✅ profiles
   - ✅ caregiver_availability
   - ✅ family_availability
   - ✅ notifications

---

## 👑 PASSO 6: Diventare Superuser

Dopo esserti registrato tramite l'app:

1. Vai su **SQL Editor** in Supabase
2. Esegui questa query (sostituisci con la TUA email):

```sql
UPDATE profiles 
SET role = 'superuser' 
WHERE email = 'tua-email@esempio.it';
```

3. Fai logout e login di nuovo nell'app
4. Ora vedrai il pulsante "⚙️ Admin" nel menu

---

## ✅ CHECKLIST FINALE

Prima di considerare tutto configurato, verifica:

- [ ] Progetto Supabase creato
- [ ] Schema SQL eseguito (4 tabelle create)
- [ ] File `.env.local` creato con le chiavi corrette
- [ ] `VITE_SUPABASE_URL` impostato correttamente
- [ ] `VITE_SUPABASE_ANON_KEY` impostato correttamente
- [ ] Account Resend creato (per le email)
- [ ] `RESEND_API_KEY` impostato
- [ ] `FROM_EMAIL` impostato
- [ ] Variabili d'ambiente aggiunte anche su Vercel
- [ ] Il tuo account è stato impostato come `superuser`
- [ ] L'app parte correttamente con `npm run dev`
- [ ] Riesci a registrarti e fare login
- [ ] Le notifiche in-app funzionano

---

## 🆘 PROBLEMI COMUNI

### "Invalid API key"
→ Hai copiato male la anon key. Ricopiala da Supabase > Settings > API

### "relation profiles does not exist"
→ Non hai eseguito lo schema SQL. Vai al Passo 5.

### Le email non arrivano
→ Verifica che `RESEND_API_KEY` sia corretta
→ Controlla la cartella spam
→ Se usi il sandbox, le email arrivano solo a indirizzi verificati su Resend

### "User already registered"
→ L'email è già in uso. Usa un'altra email o elimina l'utente da Supabase > Authentication > Users

### Dopo il deploy su Vercel l'app non funziona
→ Hai dimenticato di aggiungere le variabili d'ambiente su Vercel (Passo 4)
→ Dopo averle aggiunte, devi fare "Redeploy"

---

## 📞 SUPPORTO

- Documentazione Supabase: https://supabase.com/docs
- Documentazione Resend: https://resend.com/docs
- Documentazione Vercel: https://vercel.com/docs
