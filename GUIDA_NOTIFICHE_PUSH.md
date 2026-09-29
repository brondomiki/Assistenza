# 📱 Configurazione Notifiche Push

## Panoramica

Le notifiche push permettono di ricevere avvisi sullo smartphone anche quando l'app è chiusa o il telefono è bloccato, ogni volta che un altro utente inserisce una disponibilità nel calendario.

## ✅ Funzionalità Implementate

1. **Service Worker** (`public/sw.js`)
   - Gestisce le notifiche push in background
   - Mostra notifiche anche con app chiusa
   - Supporta click sulla notifica per aprire l'app

2. **Hook React** (`src/hooks/usePushNotifications.ts`)
   - Richiesta permessi notifiche
   - Gestione subscription push
   - Notifiche locali quando l'app è aperta

3. **Componente UI** (`src/components/PushNotificationButton.tsx`)
   - Pulsante per attivare/disattivare notifiche
   - Mostra stato attuale (attive/bloccate/disabilitate)

4. **Integrazione Calendari**
   - Notifiche automatiche quando qualcuno inserisce disponibilità
   - Funziona sia per badanti che per familiari

## 🔧 Configurazione Richiesta

### 1. Generare Chiavi VAPID

Le notifiche push richiedono chiavi VAPID per l'autenticazione.

#### Opzione A: Usare un generatore online
1. Vai su https://web-push-book.gauntface.com/
2. Clicca su "Generate VAPID Keys"
3. Copia la **Public Key** e la **Private Key**

#### Opzione B: Usare Node.js
```bash
npm install -g web-push
web-push generate-vapid-keys
```

### 2. Configurare Supabase

#### 2.1 Creare la tabella per le subscription

Esegui questo SQL nel **SQL Editor** di Supabase:

```sql
-- Tabella per salvare le subscription push
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Abilita RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: gli utenti possono gestire solo le proprie subscription
CREATE POLICY "Utenti possono gestire le proprie subscription" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
```

#### 2.2 Creare una Edge Function per inviare notifiche push

Crea una nuova Edge Function in Supabase:

```bash
supabase functions new send-push-notification
```

Contenuto di `supabase/functions/send-push-notification/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:your-email@example.com";

serve(async (req) => {
  try {
    const { message, url } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Recupera tutte le subscription
    const {  subscriptions } = await supabase
      .from("push_subscriptions")
      .select("subscription");

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0 }));
    }

    // Importa web-push
    const webpush = await import("https://esm.sh/web-push@3.6.6");

    // Configura VAPID
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY!,
      VAPID_PRIVATE_KEY!
    );

    // Invia notifiche a tutte le subscription
    const notificationPayload = JSON.stringify({
      title: "Assistenza Anziani",
      body: message,
      url: url || "/",
      icon: "/icon-192.png",
    });

    let sentCount = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, notificationPayload);
        sentCount++;
      } catch (error) {
        console.error("Errore invio notifica:", error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

#### 2.3 Configurare le variabili d'ambiente in Supabase

```bash
supabase secrets set VAPID_PUBLIC_KEY=la-tua-public-key
supabase secrets set VAPID_PRIVATE_KEY=la-tua-private-key
supabase secrets set VAPID_SUBJECT=mailto:your-email@example.com
```

#### 2.4 Deploy della Edge Function

```bash
supabase functions deploy send-push-notification
```

### 3. Configurare il Frontend

#### 3.1 Aggiornare `.env.local`

```env
VITE_VAPID_PUBLIC_KEY=la-tua-public-key
```

#### 3.2 Aggiornare `src/hooks/usePushNotifications.ts`

Sostituisci la chiave VAPID hardcoded con quella dalle variabili d'ambiente:

```typescript
const applicationServerKey = urlBase64ToUint8Array(
  import.meta.env.VITE_VAPID_PUBLIC_KEY
);
```

### 4. Configurare Vercel

Aggiungi la variabile d'ambiente in Vercel:

1. Vai su **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Aggiungi:
   - **Name**: `VITE_VAPID_PUBLIC_KEY`
   - **Value**: la tua public key VAPID
   - **Environment**: Production, Preview, Development

### 5. Creare Icone per le Notifiche

Crea queste icone nella cartella `public/`:

- `icon-192.png` (192x192px)
- `badge-72.png` (72x72px, monocromatica)

Puoi usare strumenti online come https://favicon.io/ per generarle.

## 🧪 Testing

### Test su Desktop

1. Apri l'app nel browser
2. Clicca sul pulsante "🔔 Attiva notifiche"
3. Accetta il permesso
4. Inserisci una disponibilità in un altro browser/account
5. Dovresti vedere la notifica

### Test su Smartphone

1. Apri l'app su Chrome/Safari
2. Clicca su "🔔 Attiva notifiche"
3. Accetta il permesso
4. Blocca il telefono
5. Inserisci una disponibilità da un altro dispositivo
6. Dovresti ricevere la notifica anche a telefono bloccato

## 🔍 Troubleshooting

### Le notifiche non arrivano

1. **Controlla i permessi del browser**
   - Chrome: Impostazioni → Privacy e sicurezza → Notifiche
   - Safari: Preferenze → Siti web → Notifiche

2. **Verifica che il Service Worker sia registrato**
   - Apri DevTools → Application → Service Workers
   - Dovresti vedere `sw.js` registrato

3. **Controlla la console per errori**
   - Apri DevTools → Console
   - Cerca errori relativi a push notifications

### Le notifiche arrivano ma senza suono/vibrazione

- Alcuni browser limitano le notifiche silenziose
- Verifica le impostazioni di notifica del sistema operativo

### Errori VAPID

- Assicurati che le chiavi VAPID siano corrette
- Verifica che la public key nel frontend corrisponda a quella nel backend
- Controlla che il subject VAPID sia un'email valida o un URL

## 📚 Risorse

- [Web Push Book](https://web-push-book.gauntface.com/)
- [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## 🎯 Prossimi Passi

Per migliorare ulteriormente le notifiche:

1. **Notifiche personalizzate per tipo di evento**
   - Icone diverse per disponibilità/rimozione
   - Azioni rapide nella notifica (es: "Visualizza calendario")

2. **Silenzioso di notte**
   - Non inviare notifiche tra le 22:00 e le 08:00

3. **Raggruppamento notifiche**
   - Raggruppare notifiche multiple dello stesso tipo

4. **Badge counter**
   - Mostrare il numero di notifiche non lette sull'icona dell'app
