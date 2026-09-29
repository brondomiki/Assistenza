import { useState } from 'react';
import { useInAppNotifications } from '../hooks/useInAppNotifications';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useInAppNotifications();
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 hover:bg-gray-800 rounded-lg transition"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPanel(false)}></div>
          <div className="absolute right-0 top-12 w-80 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifiche</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Segna tutte come lette
                </button>
              )}
            </div>
            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <span className="text-3xl block mb-2">📭</span>
                  Nessuna notifica
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                    className={`p-3 border-b border-gray-800 last:border-0 cursor-pointer transition hover:bg-gray-800 ${
                      !notification.read ? 'bg-indigo-900/30' : ''
                    }`}
                  >
                    <p className="text-sm text-gray-200">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(notification.created_at), 'dd MMM yyyy, HH:mm', { locale: it })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
