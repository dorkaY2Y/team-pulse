-- WorldSkills Mental Selection App - Supabase Schema

-- User profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'competitor' CHECK (role IN ('competitor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Test categories
CREATE TABLE test_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- 'concentration', 'iq', 'multiple_choice'
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tests
CREATE TABLE tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES test_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  time_limit_seconds INTEGER, -- NULL = no time limit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read active tests" ON tests
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage tests" ON tests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Questions
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'concentration', 'iq_pattern')),
  options JSONB, -- array of {text, is_correct} for multiple choice
  correct_answer TEXT,
  points INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  media_url TEXT, -- for images in IQ tests
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read questions of active tests" ON questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tests WHERE tests.id = test_id AND tests.is_active = true)
  );

CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Test results
CREATE TABLE test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  test_id UUID REFERENCES tests(id),
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  time_taken_seconds INTEGER,
  answers JSONB, -- detailed answer log
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own results" ON test_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results" ON test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all results" ON test_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed test categories
INSERT INTO test_categories (name, display_name, description, icon) VALUES
  ('concentration', 'Koncentráció', 'Figyelmi és koncentrációs tesztek', 'eye'),
  ('iq', 'IQ Teszt', 'Logikai és intelligencia tesztek', 'brain'),
  ('multiple_choice', 'Feleletválasztós', 'Tudásfelmérő tesztek', 'list');
