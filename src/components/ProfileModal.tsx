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

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, updateProfile, deleteAccount } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '👤');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

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

        {/* Sezione Eliminazione Account */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-red-400 mb-3">Zona Pericolosa</h3>
          <p className="text-sm text-gray-400 mb-4">
            Una volta eliminato, il tuo account e tutti i dati associati verranno rimossi permanentemente.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 bg-red-900/30 border-2 border-red-700 text-red-300 rounded-lg font-medium hover:bg-red-900/50 transition"
          >
            🗑️ Elimina il mio account
          </button>
        </div>

        {/* Modal di Conferma Eliminazione */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border-2 border-red-700">
              <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                <span>⚠️</span> Conferma Eliminazione Account
              </h3>
              
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
                <p className="text-red-300 text-sm mb-2">
                  <strong>Attenzione:</strong> Questa azione è irreversibile!
                </p>
                <p className="text-red-300 text-sm">
                  Verranno eliminati:
                </p>
                <ul className="text-red-300 text-sm list-disc list-inside mt-2 space-y-1">
                  <li>Il tuo profilo utente</li>
                  <li>Tutte le tue disponibilità</li>
                  <li>Tutte le tue notifiche</li>
                  <li>L'accesso al sistema</li>
                </ul>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Per confermare, digita <strong className="text-red-400">ELIMINA</strong>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 border border-red-700 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="ELIMINA"
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                    setError('');
                  }}
                  className="flex-1 py-3 border border-gray-600 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmText !== 'ELIMINA' || deleteLoading}
                  onClick={async () => {
                    setDeleteLoading(true);
                    setError('');
                    
                    const { error } = await deleteAccount();
                    
                    if (error) {
                      setError('Errore durante l\'eliminazione dell\'account');
                      setDeleteLoading(false);
                    }
                    // Se non c'è errore, l'utente verrà automaticamente disconnesso
                  }}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? 'Eliminazione...' : '🗑️ Elimina Definitivamente'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
