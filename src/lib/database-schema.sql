-- ============================================
-- SCHEMA DATABASE SUPABASE
-- Esegui questo script nell'editor SQL di Supabase
-- ============================================

-- Tabella profili utente
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superuser', 'badante', 'familiare')) DEFAULT 'familiare',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella disponibilità badanti
CREATE TABLE caregiver_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('disponibile', 'non_disponibile')),
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Tabella disponibilità familiari (weekend e festivi)
CREATE TABLE family_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('disponibile', 'non_disponibile')),
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Tabella notifiche
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_caregiver_availability_date ON caregiver_availability(date);
CREATE INDEX idx_caregiver_availability_user ON caregiver_availability(user_id);
CREATE INDEX idx_family_availability_date ON family_availability(date);
CREATE INDEX idx_family_availability_user ON family_availability(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy per profiles
CREATE POLICY "Chiunque può vedere i profili" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Gli utenti possono modificare il proprio profilo" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Gli utenti possono inserire il proprio profilo" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy per caregiver_availability
CREATE POLICY "Chiunque può vedere la disponibilità badanti" ON caregiver_availability
  FOR SELECT USING (true);

CREATE POLICY "Le badanti possono gestire la propria disponibilità" ON caregiver_availability
  FOR ALL USING (auth.uid() = user_id);

-- Policy per family_availability
CREATE POLICY "Chiunque può vedere la disponibilità familiari" ON family_availability
  FOR SELECT USING (true);

CREATE POLICY "I familiari possono gestire la propria disponibilità" ON family_availability
  FOR ALL USING (auth.uid() = user_id);

-- Policy per notifications
CREATE POLICY "Gli utenti possono vedere le proprie notifiche" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Il sistema può inserire notifiche" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Gli utenti possono aggiornare le proprie notifiche" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Funzione per creare il profilo dopo la registrazione
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utente'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'familiare')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per creare il profilo automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_caregiver_updated_at
  BEFORE UPDATE ON caregiver_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_family_updated_at
  BEFORE UPDATE ON family_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SE HAI GIÀ IL DATABASE CREATO, esegui solo
-- queste query per aggiungere i campi orario:
-- ============================================
-- ALTER TABLE caregiver_availability ADD COLUMN IF NOT EXISTS start_time TIME;
-- ALTER TABLE caregiver_availability ADD COLUMN IF NOT EXISTS end_time TIME;
-- ALTER TABLE family_availability ADD COLUMN IF NOT EXISTS start_time TIME;
-- ALTER TABLE family_availability ADD COLUMN IF NOT EXISTS end_time TIME;
