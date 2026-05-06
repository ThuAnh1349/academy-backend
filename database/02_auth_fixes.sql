-- ============================================================
-- FIX 1: Ẩn is_correct khỏi FE
-- Policy cũ "FOR SELECT USING (true)" trả toàn bộ columns
-- kể cả is_correct — bất kỳ ai query Supabase trực tiếp
-- đều thấy đáp án đúng. Tạo view không có column này.
-- ============================================================
DROP POLICY IF EXISTS "Quiz options are readable by everyone" ON quiz_options;

CREATE OR REPLACE VIEW quiz_options_public AS
  SELECT id, quiz_id, option_text, order_index
  FROM quiz_options;

COMMENT ON VIEW quiz_options_public IS
  'FE chỉ đọc view này. is_correct không expose. BE service_role đọc table gốc khi validate.';


-- ============================================================
-- FIX 2: courses, modules, lessons chỉ trả published cho member
-- Policy cũ "USING (true)" trả cả draft — member thấy
-- được content chưa publish.
-- ============================================================
DROP POLICY IF EXISTS "Courses are readable by everyone" ON courses;
DROP POLICY IF EXISTS "Modules are readable by everyone" ON modules;
DROP POLICY IF EXISTS "Lessons are readable by everyone" ON lessons;

-- Helper: check role từ JWT app_metadata
-- Dùng lại expression này trong mọi policy bên dưới
-- auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'

CREATE POLICY "courses_select" ON courses FOR SELECT
  USING (
    is_published = true
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "modules_select" ON modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = modules.course_id
        AND (c.is_published = true
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    )
  );

CREATE POLICY "lessons_select" ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lessons.course_id
        AND (c.is_published = true
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    )
  );

CREATE POLICY "quizzes_select" ON quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE l.id = quizzes.lesson_id
        AND (c.is_published = true
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    )
  );


-- ============================================================
-- FIX 3: Admin write policies cho curriculum
-- Admin được INSERT / UPDATE / DELETE courses, modules,
-- lessons, quizzes, quiz_options (table gốc)
-- ============================================================

-- courses
CREATE POLICY "courses_insert" ON courses FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "courses_update" ON courses FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "courses_delete" ON courses FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- modules
CREATE POLICY "modules_insert" ON modules FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "modules_update" ON modules FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "modules_delete" ON modules FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- lessons
CREATE POLICY "lessons_insert" ON lessons FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "lessons_update" ON lessons FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "lessons_delete" ON lessons FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- quizzes
CREATE POLICY "quizzes_insert" ON quizzes FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "quizzes_update" ON quizzes FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "quizzes_delete" ON quizzes FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- quiz_options (table gốc — chỉ admin ghi, không ai đọc trực tiếp)
CREATE POLICY "quiz_options_insert" ON quiz_options FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "quiz_options_update" ON quiz_options FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "quiz_options_delete" ON quiz_options FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');


-- ============================================================
-- FIX 4: Admin xem progress của tất cả users
-- Policy hiện tại chỉ cho user xem data của mình.
-- Admin cần xem tất cả để track học viên.
-- ============================================================
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can view own lesson progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can view own learning events" ON learning_events;
DROP POLICY IF EXISTS "Users can view own xp ledger" ON xp_ledger;
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view own certificates" ON user_certificates;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Tạo lại với admin override
CREATE POLICY "enrollments_select" ON enrollments FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "lesson_progress_select" ON lesson_progress FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "learning_events_select" ON learning_events FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "xp_ledger_select" ON xp_ledger FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "user_achievements_select" ON user_achievements FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "user_certificates_select" ON user_certificates FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "users_select" ON users FOR SELECT
  USING (
    auth.uid() = id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
