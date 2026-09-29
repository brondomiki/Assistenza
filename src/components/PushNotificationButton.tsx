import { usePushNotifications } from '../hooks/usePushNotifications';

export default function PushNotificationButton() {
  const { permission, isSupported, requestPermission } = usePushNotifications();

  if (!isSupported) {
    return null; // Non mostrare il pulsante se le notifiche non sono supportate
  }

  const handleClick = async () => {
    if (permission === 'denied') {
      alert('Le notifiche sono bloccate. Per riabilitarle:\n\n• Chrome: Impostazioni → Privacy e sicurezza → Notifiche\n• Safari: Preferenze → Siti web → Notifiche');
      return;
    }

    if (permission === 'default') {
      await requestPermission();
    } else if (permission === 'granted') {
      alert('✅ Le notifiche sono già attive!\n\nRiceverai una notifica ogni volta che qualcuno inserisce o modifica una disponibilità.');
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
      className={`px-3 py-2 rounded-lg font-medium transition text-sm ${getButtonStyle()}`}
      title={
        permission === 'denied'
          ? 'Le notifiche sono bloccate. Abilitale dalle impostazioni del browser.'
          : permission === 'granted'
          ? 'Riceverai notifiche quando l\'app è aperta'
          : 'Clicca per attivare le notifiche'
      }
    >
      {getButtonText()}
    </button>
  );
}
