import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const academyController = {
  // Lấy danh sách khóa học (GET /api/v1/academy/learn/courses)
  getCourses: async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Lấy chi tiết 1 khóa học kèm module và bài học (GET /api/v1/academy/learn/courses/:slug)
  getCourseDetail: async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = req.user?.id;
      
      // Lấy thông tin khóa học
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .single();

      if (courseError) throw courseError;
      if (!course) return res.status(404).json({ error: 'Không tìm thấy khóa học' });

      // Lấy thông tin modules kèm bài học
      const { data: modules, error: modError } = await supabase
        .from('modules')
        .select(`
          *,
          lessons (*)
        `)
        .eq('course_id', course.id)
        .order('order_index', { ascending: true });
        
      if (modError) throw modError;

      // Real enrollment and progress (simplified)
      let enrollment = null;
      let lessonProgressMap: Record<string, any> = {};

      if (userId) {
        const { data: enr } = await supabase.from('enrollments').select('*').eq('user_id', userId).eq('course_id', course.id).single();
        enrollment = enr || null;

        const { data: progress } = await supabase.from('lesson_progress').select('*').eq('user_id', userId).eq('course_id', course.id);
        if (progress) {
          progress.forEach(p => {
            lessonProgressMap[p.lesson_id] = p;
          });
        }
      }

      res.json({
        course: {
          ...course,
          my_progress_percent: enrollment?.progress_pct || 0,
          my_xp_earned: enrollment?.xp_earned || 0,
          is_offline_downloaded: enrollment?.is_offline_downloaded || false,
          cert_progress: 0
        },
        enrollment,
        modules: modules.map((m: any) => {
           let completedLessons = 0;
           const lessons = (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index).map((l: any) => {
             const prog = lessonProgressMap[l.id];
             if (prog?.status === 'completed') completedLessons++;
             return {
               ...l,
               status: prog?.status || 'locked',
               is_locked: !prog && l.order_index > 1, // Simplified lock logic
               progress_seconds: prog?.progress_seconds || 0,
               completed_at: prog?.completed_at || null
             };
           });
           return {
              module_title: m.title,
              order_index: m.order_index,
              completion_pct: lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0,
              lessons
           };
        })
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getDashboard: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error || !user) throw error;

      // Calculate stats
      const { count: completedLessons } = await supabase.from('lesson_progress').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'completed');
      const { count: certsEarned } = await supabase.from('user_certificates').select('id', { count: 'exact' }).eq('user_id', userId);

      res.json({
        person: { id: user.id, display_name: user.display_name, avatar_initials: user.avatar_initials, avatar_url: user.avatar_url },
        stats: { total_xp: user.total_xp, current_level: user.current_level, lessons_completed: completedLessons || 0, hours_learned: 0, certs_earned: certsEarned || 0 },
        continue_learning: null, // To implement fully, query latest lesson_progress
        streak: { current_streak: user.current_streak_days, longest_streak: user.longest_streak_days, last_activity_date: user.last_active_date, streak_at_risk: false },
        daily_challenge: { xp_reward: 50, is_completed_today: false, challenge_description: 'Học 1 bài & trả lời đúng 3 câu hỏi' }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getLessonContent: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const { data: lesson, error } = await supabase.from('lessons').select('*').eq('id', id).single();
      if (error || !lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      // Fetch course info for context
      const { data: course } = await supabase.from('courses').select('*').eq('id', lesson.course_id).single();

      res.json({
         ...lesson,
         course_brief: course || null,
         prev_lesson: null,
         next_lesson: null,
         resume_at_seconds: 0
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  getGamification: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error || !user) throw error;

      const { data: userAchs } = await supabase.from('user_achievements').select('*, achievement_definitions(*)').eq('user_id', userId);

      res.json({
        total_xp: user.total_xp, current_level: user.current_level, xp_to_next_level: 500 - (user.total_xp % 500), xp_for_next_level_total: 500,
        current_streak: user.current_streak_days, longest_streak: user.longest_streak_days, last_activity_date: user.last_active_date,
        achievements: (userAchs || []).map(ua => ({
           id: ua.achievement_id,
           key: ua.achievement_definitions.key,
           title: ua.achievement_definitions.title,
           description: ua.achievement_definitions.description,
           icon_emoji: ua.achievement_definitions.icon_emoji,
           xp_reward: ua.achievement_definitions.xp_reward,
           unlocked_at: ua.unlocked_at
        })),
        xp_history: []
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
