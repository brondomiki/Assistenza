import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import CaregiverCalendar from './components/CaregiverCalendar';
import FamilyCalendar from './components/FamilyCalendar';
import Notifications from './components/Notifications';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';

type Page = 'login' | 'register' | 'dashboard' | 'caregiver' | 'family' | 'admin';

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏠</span>
            <h1 className="text-xl font-bold text-gray-800 hidden sm:block">CareScheduler</h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setPage('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                page === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="hidden sm:inline">📊 </span>Dashboard
            </button>
            <button
              onClick={() => setPage('caregiver')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                page === 'caregiver' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="hidden sm:inline">👩‍⚕️ </span>Badanti
            </button>
            <button
              onClick={() => setPage('family')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                page === 'family' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="hidden sm:inline">👨‍👩‍👧 </span>Familiari
            </button>
            {profile?.role === 'superuser' && (
              <button
                onClick={() => setPage('admin')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  page === 'admin' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="hidden sm:inline">⚙️ </span>Admin
              </button>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Notifications />
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{profile?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
              </div>
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-sm">
                  {profile?.role === 'badante' ? '👩‍⚕️' : profile?.role === 'superuser' ? '👑' : '👤'}
                </span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
            >
              Esci
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 mb-6 text-white">
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

      {/* Footer */}
      <footer className="bg-white border-t mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>CareScheduler - Gestione disponibilità assistenza anziani</p>
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
