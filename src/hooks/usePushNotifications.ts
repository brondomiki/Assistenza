import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Controlla se le notifiche sono supportate
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Registra il service worker
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('Service Worker registrato:', registration);

      // Controlla se c'è già una subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
      }
    } catch (error) {
      console.error('Errore registrazione Service Worker:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      alert('Le notifiche push non sono supportate in questo browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        await subscribeToPush();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Errore richiesta permesso:', error);
      return false;
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // VAPID public key (dovrebbe essere caricata da variabili d'ambiente)
      // Per ora usiamo una chiave di esempio
      const applicationServerKey = urlBase64ToUint8Array(
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkGs-d6bZxjQXlNpPbZPvZvZvZvZvZvZvZvZ'
      );

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      setSubscription(subscription);

      // Salva la subscription nel database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          subscription: JSON.stringify(subscription),
        });
      }

      console.log('Iscritto alle notifiche push:', subscription);
    } catch (error) {
      console.error('Errore iscrizione push:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);

        // Rimuovi la subscription dal database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
        }

        console.log('Disiscritto dalle notifiche push');
      }
    } catch (error) {
      console.error('Errore disiscrizione push:', error);
    }
  };

  // Funzione per convertire la chiave VAPID
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Funzione per mostrare una notifica locale (quando l'app è aperta)
  const showLocalNotification = (title: string, body: string, url: string = '/') => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: { url },
      } as NotificationOptions);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  return {
    permission,
    subscription,
    isSupported,
    requestPermission,
    unsubscribeFromPush,
    showLocalNotification,
  };
}
