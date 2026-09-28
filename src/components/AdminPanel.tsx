import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function AdminPanel() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'superuser') {
      fetchUsers();
    }
  }, [profile]);

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setUsers(data);
    }
    setLoading(false);
  }

  async function changeUserRole(userId: string, newRole: string) {
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    fetchUsers();
  }

  async function deleteUser(userId: string) {
    if (confirm('Sei sicuro di voler eliminare questo utente?')) {
      await supabase.from('profiles').delete().eq('id', userId);
      fetchUsers();
    }
  }

  if (profile?.role !== 'superuser') {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
        <span className="text-2xl">⚙️</span> Pannello Amministratore
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium text-gray-600">Nome</th>
              <th className="text-left p-3 font-medium text-gray-600">Email</th>
              <th className="text-left p-3 font-medium text-gray-600">Ruolo</th>
              <th className="text-left p-3 font-medium text-gray-600">Telefono</th>
              <th className="text-left p-3 font-medium text-gray-600">Registrato</th>
              <th className="text-left p-3 font-medium text-gray-600">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  Caricamento...
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{user.full_name}</td>
                  <td className="p-3 text-gray-600">{user.email}</td>
                  <td className="p-3">
                    <select
                      value={user.role}
                      onChange={(e) => changeUserRole(user.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="familiare">Familiare</option>
                      <option value="badante">Badante</option>
                      <option value="superuser">Superuser</option>
                    </select>
                  </td>
                  <td className="p-3 text-gray-600">{user.phone || '-'}</td>
                  <td className="p-3 text-gray-600">
                    {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: it })}
                  </td>
                  <td className="p-3">
                    {user.role !== 'superuser' && (
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Elimina
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Totale utenti: <span className="font-semibold">{users.length}</span>
      </div>
    </div>
  );
}
