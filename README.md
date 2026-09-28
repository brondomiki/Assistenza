# Assistenza Anziani - Portale Gestione Disponibilità

Un portale web per la gestione della disponibilità di badanti e familiari per l'assistenza di una persona anziana.

## 🚀 Funzionalità

- **Calendario Badanti**: Le badanti possono segnare i giorni di disponibilità/non disponibilità
- **Calendario Familiari**: I familiari gestiscono la disponibilità nei weekend e giorni festivi
- **Notifiche Email**: Ogni modifica viene notificata via email a tutti gli utenti
- **Registrazione Utenti**: Pagina dedicata per la registrazione con scelta del ruolo e avatar
- **Profilo Utente**: Ogni utente può modificare i propri dati (nome, telefono, avatar) cliccando sulla propria immagine
- **Eliminazione Account**: Ogni utente può eliminare il proprio account e tutti i dati associati (disponibilità, notifiche, profilo)
- **Pannello Admin**: Il superuser può gestire tutti gli utenti e i ruoli
- **Dashboard**: Panoramica della situazione attuale con calendario completo
- **Tema Scuro**: Interfaccia moderna con sfondo nero e riempimento visivo delle caselle in base alle ore

## 🛠️ Tecnologie

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend/Database**: Supabase (Auth, Database, Real-time)
- **Deploy**: Vercel

Il portale è stato progettato per facilitare la coordinazione tra badanti e familiari nella gestione dell'assistenza a persone anziane.

## 📋 Setup

### 1. Configurare Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Vai nell'editor SQL di Supabase
3. Copia e incolla il contenuto di `src/lib/database-schema.sql` ed eseguilo
4. Vai su Authentication > Providers > Email e abilita la registrazione
5. (Opzionale) Configura Supabase Auth Email Templates per le notifiche

### 2. Configurare le variabili d'ambiente

Copia `.env.example` in `.env.local`:

```bash
cp .env.example .env.local
```

Inserisci i tuoi valori:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Configurare il Superuser

Dopo aver registrato il tuo account, esegui questa query SQL in Supabase:

```sql
UPDATE profiles SET role = 'superuser' WHERE email = 'tua-email@example.com';
```

### 4. Configurare le notifiche email

Per le notifiche email automatiche, crea una Supabase Edge Function:

1. Vai su Edge Functions nel dashboard di Supabase
2. Crea una nuova function chiamata `send-notification-email`
3. Usa il codice di esempio in `supabase/functions/send-notification-email/index.ts`

### 5. Sviluppo locale

```bash
npm install
npm run dev
```

### 6. Deploy su Vercel

1. Collega il repository a Vercel
2. Aggiungi le variabili d'ambiente nel dashboard di Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automatico ad ogni push

## 📁 Struttura del Progetto

```
src/
├── App.tsx                    # Componente principale con routing
├── main.tsx                   # Entry point
├── index.css                  # Stili globali
├── env.d.ts                   # TypeScript declarations
├── lib/
│   ├── supabase.ts           # Configurazione Supabase e tipi
│   └── database-schema.sql   # Schema database completo
├── contexts/
│   └── AuthContext.tsx        # Context per autenticazione
└── components/
    ├── LoginPage.tsx          # Pagina di login
    ├── RegisterPage.tsx       # Pagina di registrazione
    ├── Dashboard.tsx          # Dashboard con statistiche
    ├── CaregiverCalendar.tsx  # Calendario badanti
    ├── FamilyCalendar.tsx     # Calendario familiari
    ├── Notifications.tsx      # Sistema notifiche
    └── AdminPanel.tsx         # Pannello amministratore
```

## 🔐 Ruoli Utente

- **Superuser**: Accesso completo, gestione utenti, modifica ruoli
- **Badante**: Gestisce il calendario della propria disponibilità
  - **Disponibilità automatica precompilata**: Al momento della registrazione, viene impostata automaticamente come disponibile dal lunedì al sabato (00:00-12:00, fino a mezzogiorno) per i prossimi 12 mesi
  - **Estensione automatica**: Quando si naviga nel calendario verso mesi futuri, le disponibilità vengono estese automaticamente per garantire copertura continua
  - **Limitazioni**: La badante NON può modificare le disponibilità precompilate, può SOLO inserire "non disponibilità" per giorni specifici
  - **Ripristino**: Se la badante inserisce una "non disponibilità", può successivamente ripristinare la disponibilità automatica
- **Familiare**: Gestisce la disponibilità nei weekend e festivi

## 📧 Notifiche Email

Ogni modifica alla disponibilità genera:
1. Una notifica in-app visibile a tutti gli utenti
2. Un'email inviata a tutti gli altri utenti (tramite Supabase Edge Function)

## 📅 Calendari

### Calendario Badanti
- Tutti i giorni della settimana
- Status: Disponibile / Non disponibile
- **Orario inizio e fine disponibilità** (se disponibile)
- Preset orari rapidi (Mattina, Pomeriggio, Giornata, ecc.)
- Note opzionali per ogni giorno

### Calendario Familiari
- Solo weekend (sabato/domenica) e giorni festivi italiani
- Status: Disponibile / Non disponibile
- **Orario inizio e fine disponibilità** (se disponibile)
- Preset orari rapidi per il weekend
- Note opzionali per ogni giorno
- Festivi italiani pre-configurati
