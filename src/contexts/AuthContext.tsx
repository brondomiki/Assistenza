import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase, Profile, UserRole } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { startOfMonth, eachDayOfInterval, format, isSunday, addMonths } from 'date-fns';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole, phone?: string, avatar?: string) => Promise<{ error: any; requiresEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then((result) => {
      const session = result.data.session;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const authChange = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    const subscription = authChange.data.subscription;

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
    setLoading(false);
  }

  async function createDefaultCaregiverAvailability(userId: string) {
    // Crea disponibilità di default per i prossimi 12 mesi
    // Lunedì-Sabato: 00:00-12:00 (fino a mezzogiorno)
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = addMonths(startDate, 12);
    
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    const availabilities = allDays
      .filter(day => !isSunday(day)) // Escludi domenica
      .map(day => ({
        user_id: userId,
        date: format(day, 'yyyy-MM-dd'),
        status: 'disponibile' as const,
        start_time: '00:00',
        end_time: '12:00',
      }));

    if (availabilities.length > 0) {
      // Inserisci in batch (Supabase ha limiti di dimensioni)
      const batchSize = 100;
      for (let i = 0; i < availabilities.length; i += batchSize) {
        const batch = availabilities.slice(i, i + batchSize);
        await supabase.from('caregiver_availability').insert(batch);
      }
    }
  }

  async function signUp(email: string, password: string, fullName: string, role: UserRole, phone?: string, avatar?: string) {
    const metaData = { full_name: fullName, role: role };
    const signUpOptions = { data: metaData };
    
    const result = await supabase.auth.signUp({
      email,
      password,
      options: signUpOptions
    });

    const data = result.data;
    const error = result.error;

    if (error) {
      return { error, requiresEmailConfirmation: false };
    }

    // Aggiorna il profilo con telefono e avatar se forniti
    if (!error && data.user) {
      const updates: any = {};
      if (phone) updates.phone = phone;
      if (avatar) updates.avatar = avatar;
      
      if (Object.keys(updates).length > 0) {
        await supabase.from('profiles').update(updates).eq('id', data.user.id);
      }

      // Se è una badante, crea disponibilità di default (lun-sab 00:00-23:59, 24h)
      if (role === 'badante') {
        try {
          await createDefaultCaregiverAvailability(data.user.id);
        } catch (err) {
          console.error('Errore nella creazione disponibilità default:', err);
        }
      }
    }

    // Controlla se l'utente è già autenticato (conferma email disabilitata)
    // o se deve confermare l'email
    const requiresEmailConfirmation = !data.session;

    return { error: null, requiresEmailConfirmation };
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      // Aggiorna il profilo nel context
      await fetchProfile(user.id);
    }

    return { error };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
