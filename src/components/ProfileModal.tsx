import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/supabase';

const AVATAR_OPTIONS = [
  { emoji: '👨', label: 'Uomo' },
  { emoji: '👩', label: 'Donna' },
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

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '👤');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    const { error } = await updateProfile({
      full_name: fullName,
      phone,
      avatar,
    });

    if (error) {
      setError('Errore durante l\'aggiornamento del profilo');
    } else {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>👤</span> Modifica Profilo
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">
              ✅ Profilo aggiornato con successo!
            </div>
          )}

          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Avatar</label>
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map((option) => (
                <button
                  key={option.emoji}
                  type="button"
                  onClick={() => setAvatar(option.emoji)}
                  className={`w-10 h-10 rounded-lg text-2xl flex items-center justify-center transition ${
                    avatar === option.emoji
                      ? 'bg-indigo-900/50 border-2 border-indigo-500 scale-110'
                      : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                  }`}
                  title={option.label}
                >
                  {option.emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Mario Rossi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800/50 text-gray-400 rounded-lg cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">L'email non può essere modificata</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Telefono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="+39 333 1234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ruolo</label>
            <input
              type="text"
              value={profile?.role === 'superuser' ? 'Amministratore' : profile?.role === 'badante' ? 'Badante' : 'Familiare'}
              disabled
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800/50 text-gray-400 rounded-lg cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Il ruolo può essere modificato solo dall'amministratore</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-600 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvataggio...' : '💾 Salva modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
