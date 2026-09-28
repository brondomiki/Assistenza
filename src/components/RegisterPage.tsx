import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/supabase';

const AVATAR_OPTIONS = [
  { emoji: '👨', label: 'Uomo' },
  { emoji: '👩', label: 'Donna' },
  { emoji: '👨🏽', label: 'Uomo' },
  { emoji: '👩🏽', label: 'Donna' },
  { emoji: '👨🏾', label: 'Uomo' },
  { emoji: '👩🏾', label: 'Donna' },
  { emoji: '👨🏿', label: 'Uomo' },
  { emoji: '👩🏿', label: 'Donna' },
  { emoji: '👨‍🦱', label: 'Capelli ricci' },
  { emoji: '👩‍🦱', label: 'Capelli ricci' },
  { emoji: '👨‍🦰', label: 'Capelli rossi' },
  { emoji: '👩‍🦰', label: 'Capelli rossi' },
  { emoji: '👴', label: 'Anziano' },
  { emoji: '👵', label: 'Anziana' },
  { emoji: '👨‍⚕️', label: 'Dottore' },
  { emoji: '👩‍⚕️', label: 'Dottoressa' },
  { emoji: '👨‍👩‍👧', label: 'Famiglia' },
  { emoji: '👨‍👩‍👦', label: 'Famiglia' },
  { emoji: '👨‍👧', label: 'Papà' },
  { emoji: '👩‍👧', label: 'Mamma' },
  { emoji: '👨‍👦', label: 'Papà' },
  { emoji: '👩‍👦', label: 'Mamma' },
  { emoji: '🧑', label: 'Persona' },
  { emoji: '👤', label: 'Utente' },
  { emoji: '🙂', label: 'Sorridente' },
  { emoji: '😊', label: 'Felice' },
];

export default function RegisterPage({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('familiare');
  const [avatar, setAvatar] = useState('👤');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }

    setLoading(true);
    const { error, requiresEmailConfirmation } = await signUp(email, password, fullName, role, phone, avatar);
    
    if (error) {
      setError(error.message === 'User already registered'
        ? 'Questo indirizzo email è già registrato.'
        : error.message);
    } else {
      if (requiresEmailConfirmation) {
        // Email confirmation required
        setSuccess(true);
      } else {
        // No email confirmation needed, user is already logged in
        // The AuthProvider will handle the redirect automatically
        onSwitchToLogin();
      }
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Registrazione completata!</h2>
          <p className="text-gray-500 mb-6">
            Controlla la tua email per confermare l'account. Dopo la conferma potrai accedere.
          </p>
          <button
            onClick={onSwitchToLogin}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Vai al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Registrati</h1>
          <p className="text-gray-500 mt-2">Crea il tuo account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scegli il tuo avatar</label>
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map((option) => (
                <button
                  key={option.emoji}
                  type="button"
                  onClick={() => setAvatar(option.emoji)}
                  className={`w-10 h-10 rounded-lg text-2xl flex items-center justify-center transition ${
                    avatar === option.emoji
                      ? 'bg-indigo-100 border-2 border-indigo-500 scale-110'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                  title={option.label}
                >
                  {option.emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Mario Rossi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="la-tua@email.it"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="+39 333 1234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              <option value="familiare">Familiare</option>
              <option value="badante">Badante</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Minimo 6 caratteri"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conferma Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Ripeti la password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Hai già un account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-indigo-600 font-medium hover:text-indigo-700"
            >
              Accedi
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
