import { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import fs from 'fs';
import path from 'path';

const CATEGORIES_FILE = path.join(__dirname, '../../data/categories.json');

const ensureCategoriesFile = () => {
  if (!fs.existsSync(path.dirname(CATEGORIES_FILE))) {
    fs.mkdirSync(path.dirname(CATEGORIES_FILE), { recursive: true });
  }
  if (!fs.existsSync(CATEGORIES_FILE)) {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify([
      { id: 'tuDuy', name: 'Tư duy', key: 'tuDuy', emoji: '🧠', color: '#06D6A0' },
      { id: 'taiChinh', name: 'Tài chính', key: 'taiChinh', emoji: '💰', color: '#118AB2' },
      { id: 'ngheNghiep', name: 'Nghề nghiệp', key: 'ngheNghiep', emoji: '💼', color: '#073B4C' },
      { id: 'giaoTiep', name: 'Giao tiếp', key: 'giaoTiep', emoji: '🗣️', color: '#F78C6B' },
      { id: 'sucKhoe', name: 'Sức khoẻ', key: 'sucKhoe', emoji: '🌱', color: '#8338EC' }
    ], null, 2));
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    ensureCategoriesFile();
    const data = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'failed_to_get_categories' });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    ensureCategoriesFile();
    const { name, key, description, emoji, color } = req.body;
    
    const data = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
    const categories = JSON.parse(data);
    
    if (categories.find((c: any) => c.key === key)) {
      res.status(400).json({ error: 'category_exists' });
      return;
    }
    
    const newCategory = { id: key, name, key, description, emoji: emoji || '📁', color: color || '#888' };
    categories.push(newCategory);
    
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'failed_to_create_category' });
  }
};


export const getAdminDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Basic stats
    const { count: totalUsers } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true });
    const { count: totalCourses } = await supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true);
    
    // For simplicity, we just return mock calculations based on real user count
    res.json({
      totalUsers: totalUsers || 0,
      totalCourses: totalCourses || 0,
      satisfactionRate: 94.2, // mock
      xpGivenToday: 312, // mock
      activeToday: 24, // mock
      completedCourses: 89, // mock
      certsIssued: 34 // mock
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'failed_to_fetch_stats' });
  }
};

export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, display_name, user_type, total_xp, current_streak_days, last_active_date')
      .order('total_xp', { ascending: false });

    if (error) throw error;

    res.json(users || []);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'failed_to_fetch_users' });
  }
};

// ==========================================
// MOCK/REAL CRUD for UI completeness
// ==========================================

export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin.from('courses').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'failed_to_fetch_courses' });
  }
};



export const getAchievements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin.from('achievement_definitions').select('*');
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'failed_to_fetch_achievements' });
  }
};



export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, slug, description, category, difficulty_level, xp_on_complete } = req.body;
    
    // Defaulting missing fields to satisfy DB schema
    const newCourse = {
      title: title || 'Khoá học mới',
      slug: slug || `course-${Date.now()}`,
      description: description || '',
      category: category || 'tuDuy',
      difficulty_level: difficulty_level || 'co_ban',
      xp_on_complete: parseInt(xp_on_complete) || 0,
      is_published: false
    };

    const { data, error } = await supabaseAdmin.from('courses').insert([newCourse]).select().single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'failed_to_create_course' });
  }
};

export const createLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    // Because lesson requires module_id and course_id, we will mock if not provided.
    // In a real app, the UI would send these.
    const { title, lesson_type, duration_minutes, xp_on_complete, course_id, module_id, video_url, content_data } = req.body;
    
    if (!course_id || !module_id) {
      res.status(400).json({ error: 'Thiếu course_id hoặc module_id' });
      return;
    }

    const type = lesson_type?.toLowerCase() === 'quiz' ? 'quiz' : (lesson_type?.toLowerCase() === 'exercise' ? 'exercise' : 'video');

    const newLesson = {
      course_id,
      module_id,
      title: title || 'Bài học mới',
      order_index: 1,
      lesson_type: type,
      duration_minutes: parseInt(duration_minutes) || 0,
      xp_on_complete: parseInt(xp_on_complete) || 0,
      video_url: video_url || null,
      content_body: content_data || null
    };

    const { data, error } = await supabaseAdmin.from('lessons').insert([newLesson]).select().single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ error: 'failed_to_create_lesson' });
  }
};

export const createAchievement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, title, description, emoji, xp_reward } = req.body;
    const newAch = {
      key: key || `ach_${Date.now()}`,
      title: title || 'Thành tích mới',
      description: description || '',
      icon_emoji: emoji || '🏆',
      xp_reward: parseInt(xp_reward) || 0,
      trigger_condition: { condition: "mock" }
    };

    const { data, error } = await supabaseAdmin.from('achievement_definitions').insert([newAch]).select().single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({ error: 'failed_to_create_achievement' });
  }
};


export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    ensureCategoriesFile();
    const { key } = req.params;
    const { name, description, emoji, color } = req.body;
    
    const data = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
    const categories = JSON.parse(data);
    
    const index = categories.findIndex((c: any) => c.key === key);
    if (index === -1) {
      res.status(404).json({ error: 'category_not_found' });
      return;
    }
    
    categories[index] = { ...categories[index], name: name || categories[index].name, description: description || categories[index].description, emoji: emoji || categories[index].emoji, color: color || categories[index].color };
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    
    res.json(categories[index]);
  } catch (error) {
    res.status(500).json({ error: 'failed_to_update_category' });
  }
};

export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, slug, description, category, difficulty_level, xp_on_complete, is_published } = req.body;
    const updateData: any = { title, slug, description, category, difficulty_level, xp_on_complete: parseInt(xp_on_complete) || 0 };
    if (is_published !== undefined) {
      updateData.is_published = is_published;
    }
    
    const { data, error } = await supabaseAdmin.from('courses').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'failed_to_update_course' });
  }
};

export const createModule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { course_id, title } = req.body;
    const { data, error } = await supabaseAdmin.from('modules').insert([{ course_id, title, order_index: 99 }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'failed_to_create_module' });
  }
};

export const updateModule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const { data, error } = await supabaseAdmin.from('modules').update({ title }).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'failed_to_update_module' });
  }
};

export const updateLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, lesson_type, duration_minutes, xp_on_complete } = req.body;
    const updateData = { title, lesson_type, duration_minutes: parseInt(duration_minutes) || 0, xp_on_complete: parseInt(xp_on_complete) || 0 };
    
    const { data, error } = await supabaseAdmin.from('lessons').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'failed_to_update_lesson' });
  }
};

export const getCourseModules = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin.from('modules').select('*, lessons(*)').eq('course_id', req.params.id).order('order_index');
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'failed_to_get_modules' });
  }
};

export const deleteModule = async (req: Request, res: Response): Promise<void> => {
  try {
    await supabaseAdmin.from('modules').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'failed_to_delete' });
  }
};

export const deleteLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    await supabaseAdmin.from('lessons').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'failed_to_delete' });
  }
};
