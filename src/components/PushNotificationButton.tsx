import { usePushNotifications } from '../hooks/usePushNotifications';

export default function PushNotificationButton() {
  const { permission, isSupported, requestPermission, unsubscribeFromPush } = usePushNotifications();

  if (!isSupported) {
    return null; // Non mostrare il pulsante se le notifiche non sono supportate
  }

  const handleClick = async () => {
    if (permission === 'granted') {
      // Già abilitate, chiedi se vuole disabilitare
      if (confirm('Vuoi disabilitare le notifiche push?')) {
        await unsubscribeFromPush();
      }
    } else {
      // Richiedi il permesso
      await requestPermission();
    }
  };

  const getButtonText = () => {
    switch (permission) {
      case 'granted':
        return '🔔 Notifiche attive';
      case 'denied':
        return '🔕 Notifiche bloccate';
      default:
        return '🔔 Attiva notifiche';
    }
  };

  const getButtonStyle = () => {
    switch (permission) {
      case 'granted':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'denied':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white';
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`px-4 py-2 rounded-lg font-medium transition ${getButtonStyle()}`}
      title={
        permission === 'denied'
          ? 'Le notifiche sono bloccate. Abilitale dalle impostazioni del browser.'
          : permission === 'granted'
          ? 'Riceverai notifiche anche a telefono bloccato'
          : 'Clicca per attivare le notifiche push'
      }
    >
      {getButtonText()}
    </button>
  );
}
