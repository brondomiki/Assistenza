import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import CaregiverCalendar from './components/CaregiverCalendar';
import FamilyCalendar from './components/FamilyCalendar';
import Notifications from './components/Notifications';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import ProfileModal from './components/ProfileModal';
import PushNotificationButton from './components/PushNotificationButton';
import ToastNotification from './components/ToastNotification';

type Page = 'login' | 'register' | 'dashboard' | 'caregiver' | 'family' | 'admin';

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (page === 'register') {
      return <RegisterPage onSwitchToLogin={() => setPage('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setPage('register')} />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Toast Notification */}
      <ToastNotification />
      
      {/* Header */}
      <header className="bg-gray-900 shadow-sm border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏠</span>
            <h1 className="text-xl font-bold text-white">Assistenza Anziani</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Notifications />
            <PushNotificationButton />
            
            {/* Mobile: avatar + nome compatto */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-9 h-9 bg-indigo-900 rounded-full flex items-center justify-center hover:bg-indigo-800 transition cursor-pointer border-2 border-indigo-700 hover:border-indigo-500"
                title="Modifica profilo"
              >
                <span className="text-lg">
                  {profile?.avatar || (profile?.role === 'badante' ? '👩‍⚕️' : profile?.role === 'superuser' ? '👑' : '👤')}
                </span>
              </button>
              <div className="text-right">
                <p className="text-xs font-medium text-white truncate max-w-[80px]">{profile?.full_name}</p>
              </div>
            </div>
            
            {/* Desktop: avatar + nome + ruolo completo */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{profile?.full_name}</p>
                <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-10 h-10 bg-indigo-900 rounded-full flex items-center justify-center hover:bg-indigo-800 transition cursor-pointer border-2 border-indigo-700 hover:border-indigo-500"
                title="Modifica profilo"
              >
                <span className="text-xl">
                  {profile?.avatar || (profile?.role === 'badante' ? '👩‍⚕️' : profile?.role === 'superuser' ? '👑' : '👤')}
                </span>
              </button>
            </div>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg text-gray-300 hover:bg-gray-800 transition"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              onClick={signOut}
              className="hidden sm:block px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 rounded-lg transition font-medium"
            >
              Esci
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="border-t border-gray-800 bg-gray-900">
            <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
              <button
                onClick={() => { setPage('dashboard'); setShowMobileMenu(false); }}
                className={`px-4 py-3 rounded-lg text-left font-medium transition ${
                  page === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => { setPage('caregiver'); setShowMobileMenu(false); }}
                className={`px-4 py-3 rounded-lg text-left font-medium transition ${
                  page === 'caregiver' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                👩‍⚕️ Badanti
              </button>
              <button
                onClick={() => { setPage('family'); setShowMobileMenu(false); }}
                className={`px-4 py-3 rounded-lg text-left font-medium transition ${
                  page === 'family' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                👨‍👩‍👧 Familiari
              </button>
              {profile?.role === 'superuser' && (
                <button
                  onClick={() => { setPage('admin'); setShowMobileMenu(false); }}
                  className={`px-4 py-3 rounded-lg text-left font-medium transition ${
                    page === 'admin' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  ⚙️ Admin
                </button>
              )}
              <button
                onClick={signOut}
                className="sm:hidden px-4 py-3 rounded-lg text-left font-medium text-red-400 hover:bg-red-900/30 transition"
              >
                🚪 Esci
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <h2 className="text-2xl font-bold">
            Ciao, {profile?.full_name}! 👋
          </h2>
          <p className="text-indigo-100 mt-1">
            {profile?.role === 'badante' 
              ? 'Gestisci la tua disponibilità come badante'
              : profile?.role === 'superuser'
              ? 'Hai accesso completo al sistema di gestione'
              : 'Gestisci la tua disponibilità come familiare nei weekend e festivi'}
          </p>
        </div>

        {/* Page Content */}
        {page === 'dashboard' && <Dashboard />}
        {page === 'caregiver' && <CaregiverCalendar />}
        {page === 'family' && <FamilyCalendar />}
        {page === 'admin' && <AdminPanel />}
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          <p>Assistenza Anziani - Gestione disponibilità</p>
          <p className="mt-1">Ogni modifica viene notificata via email a tutti gli utenti</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
