-- ==========================================
-- ACADEMY NLT - DATABASE SCHEMA (SUPABASE)
-- Phiên bản 1.0
-- ==========================================

-- 0. XÓA SCHEMA CŨ NẾU ĐÃ TỒN TẠI
DROP TABLE IF EXISTS user_certificates CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS xp_ledger CASCADE;
DROP TABLE IF EXISTS learning_events CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS quiz_options CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS cert_definitions CASCADE;
DROP TABLE IF EXISTS achievement_definitions CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS course_modules CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS proficiency_level CASCADE;
DROP TYPE IF EXISTS lesson_type CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;
DROP TYPE IF EXISTS lesson_status CASCADE;

-- 1. users
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_initials TEXT,
  avatar_url TEXT,
  user_type TEXT NOT NULL DEFAULT 'community' CHECK (user_type IN ('internal', 'community')),
  team_id TEXT,
  current_level TEXT NOT NULL DEFAULT 'co_ban' CHECK (current_level IN ('co_ban', 'trung_cap', 'nang_cao')),
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('tuDuy', 'taiChinh', 'ngheNghiep', 'giaoTiep', 'sucKhoe')),
  thumbnail_emoji TEXT,
  thumbnail_color TEXT,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  total_duration_minutes INTEGER NOT NULL DEFAULT 0,
  difficulty_level TEXT NOT NULL DEFAULT 'co_ban' CHECK (difficulty_level IN ('co_ban', 'trung_cap', 'nang_cao')),
  is_offline_available BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  xp_on_complete INTEGER NOT NULL DEFAULT 0,
  cert_category TEXT,
  avg_rating NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. achievement_definitions
CREATE TABLE achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_emoji TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  trigger_condition JSONB NOT NULL
);

-- 4. cert_definitions
CREATE TABLE cert_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_course_ids UUID[] NOT NULL,
  required_course_count INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0
);

-- 5. modules
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('video', 'quiz', 'exercise')),
  duration_minutes INTEGER,
  video_url TEXT,
  video_stream_id TEXT,
  content_body TEXT,
  offline_package_url TEXT,
  xp_on_complete INTEGER NOT NULL DEFAULT 0,
  is_prerequisite_unlock BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  xp_if_correct INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. quiz_options
CREATE TABLE quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  order_index INTEGER NOT NULL
);

-- 9. enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_offline_downloaded BOOLEAN NOT NULL DEFAULT false,
  last_accessed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- 10. lesson_progress
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  offline_completed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, lesson_id)
);

-- 11. learning_events
CREATE TABLE learning_events (
  id UUID PRIMARY KEY, -- id is generated by FE before sync
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  metadata JSONB,
  xp_delta INTEGER NOT NULL DEFAULT 0,
  occurred_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id TEXT,
  is_offline_event BOOLEAN NOT NULL DEFAULT false
);

-- 12. xp_ledger
CREATE TABLE xp_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES learning_events(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. user_achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 14. user_certificates
CREATE TABLE user_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cert_id UUID NOT NULL REFERENCES cert_definitions(id) ON DELETE CASCADE,
  cert_code TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, cert_id)
);

-- ==========================================
-- INDEXES & PERFORMANCE
-- ==========================================
CREATE INDEX idx_lp_user_course ON lesson_progress(user_id, course_id);
CREATE INDEX idx_lp_user_lesson ON lesson_progress(user_id, lesson_id);
CREATE INDEX idx_le_user_type ON learning_events(user_id, event_type);
CREATE INDEX idx_le_occurred_at ON learning_events(occurred_at DESC);
CREATE INDEX idx_le_user_occurred ON learning_events(user_id, occurred_at DESC);
CREATE INDEX idx_enroll_user ON enrollments(user_id);
CREATE INDEX idx_enroll_last_accessed ON enrollments(user_id, last_accessed_at DESC);
CREATE INDEX idx_xp_user ON xp_ledger(user_id, created_at DESC);
CREATE INDEX idx_courses_category ON courses(category) WHERE is_published = true;
CREATE INDEX idx_ua_user ON user_achievements(user_id);

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cert_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certificates ENABLE ROW LEVEL SECURITY;

-- users: chỉ sửa/đọc data của mình
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Curriculum: ai cũng đọc được
CREATE POLICY "Courses are readable by everyone" ON courses FOR SELECT USING (true);
CREATE POLICY "Modules are readable by everyone" ON modules FOR SELECT USING (true);
CREATE POLICY "Lessons are readable by everyone" ON lessons FOR SELECT USING (true);
CREATE POLICY "Quizzes are readable by everyone" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Quiz options are readable by everyone" ON quiz_options FOR SELECT USING (true);

-- Gamification Catalog: ai cũng đọc được
CREATE POLICY "Achievement definitions are readable by everyone" ON achievement_definitions FOR SELECT USING (true);
CREATE POLICY "Certificate definitions are readable by everyone" ON cert_definitions FOR SELECT USING (true);

-- User Progress: Chỉ đọc/ghi data của mình
CREATE POLICY "Users can view own enrollments" ON enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own enrollments" ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enrollments" ON enrollments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own lesson progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lesson progress" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lesson progress" ON lesson_progress FOR UPDATE USING (auth.uid() = user_id);

-- Events & Ledger: Append-only
CREATE POLICY "Users can view own learning events" ON learning_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own learning events" ON learning_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own xp ledger" ON xp_ledger FOR SELECT USING (auth.uid() = user_id);

-- Gamification Data
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own certificates" ON user_certificates FOR SELECT USING (auth.uid() = user_id);
