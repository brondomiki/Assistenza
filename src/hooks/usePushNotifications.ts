import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Controlla se le notifiche sono supportate
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      alert('Le notifiche non sono supportate in questo browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Errore richiesta permesso:', error);
      return false;
    }
  };

  // Funzione per mostrare una notifica locale (quando l'app è aperta)
  const showLocalNotification = (title: string, body: string, url: string = '/') => {
    if (permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'availability-update',
        data: { url },
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Chiudi automaticamente dopo 5 secondi
      setTimeout(() => notification.close(), 5000);
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showLocalNotification,
  };
}
