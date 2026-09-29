import { useEffect, useState } from 'react';
import { useInAppNotifications } from '../hooks/useInAppNotifications';

export default function ToastNotification() {
  const { notifications, unreadCount } = useInAppNotifications();
  const [showToast, setShowToast] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<string>('');
  const [previousUnreadCount, setPreviousUnreadCount] = useState(unreadCount);

  useEffect(() => {
    // Mostra toast quando arriva una nuova notifica
    if (unreadCount > previousUnreadCount && notifications.length > 0) {
      const latestNotification = notifications[0];
      setCurrentNotification(latestNotification.message);
      setShowToast(true);

      // Suono di notifica (opzionale)
      playNotificationSound();

      // Nascondi dopo 5 secondi
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    }

    setPreviousUnreadCount(unreadCount);
  }, [unreadCount, notifications]);

  const playNotificationSound = () => {
    // Crea un suono di notifica semplice usando Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio non supportato');
    }
  };

  if (!showToast) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-in">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔔</div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Nuova notifica</p>
            <p className="text-sm mt-1 opacity-90">{currentNotification}</p>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="text-white hover:text-gray-200 transition"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
