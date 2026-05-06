import { supabase } from './config/supabase';

async function seed() {
  console.log('Seeding courses...');
  const { data, error } = await supabase.from('courses').upsert([
    {
      slug: 'critical-thinking-l1', 
      title: 'Tư duy phản biện cơ bản', 
      description: 'Nhận diện và phân tích các lỗi lập luận phổ biến trong cuộc sống.',
      category: 'tuDuy', 
      difficulty_level: 'co_ban', 
      thumbnail_emoji: '🧠',
      total_duration_minutes: 130, 
      xp_on_complete: 200, 
      is_offline_available: true, 
      is_published: true
    },
    {
      slug: 'finance-l1', 
      title: 'Quản lý tài chính cá nhân từ A–Z', 
      description: '',
      category: 'taiChinh', 
      difficulty_level: 'co_ban', 
      thumbnail_emoji: '💰',
      total_duration_minutes: 200, 
      xp_on_complete: 300, 
      is_offline_available: true, 
      is_published: true
    },
    {
      slug: 'career-l1', 
      title: 'Kỹ năng xin việc & phỏng vấn', 
      description: '',
      category: 'ngheNghiep', 
      difficulty_level: 'co_ban', 
      thumbnail_emoji: '💼',
      total_duration_minutes: 240, 
      xp_on_complete: 400, 
      is_offline_available: true, 
      is_published: true
    },
    {
      slug: 'communication-l1', 
      title: 'Nói trước đám đông tự tin', 
      description: '',
      category: 'giaoTiep', 
      difficulty_level: 'co_ban', 
      thumbnail_emoji: '🗣️',
      total_duration_minutes: 150, 
      xp_on_complete: 200, 
      is_offline_available: false, 
      is_published: true
    }
  ], { onConflict: 'slug' }).select();

  if (error || !data) {
    console.error('Error seeding courses:', error);
    return;
  }
  console.log('Inserted courses:', data.length);

  // Seed modules for the first course
  const courseId = data[0].id;

  // Clear existing modules for this course to avoid duplicates
  await supabase.from('modules').delete().eq('course_id', courseId);

  const { data: modules, error: modError } = await supabase.from('modules').insert([
    { course_id: courseId, title: 'Module 1 — Nền tảng tư duy', order_index: 1 },
    { course_id: courseId, title: 'Module 2 — Nhận diện ngụy biện', order_index: 2 }
  ]).select();

  if (modError || !modules) {
    console.error('Error seeding modules:', modError);
    return;
  }
  console.log('Inserted modules:', modules.length);

  // Seed lessons
  const mod1Id = modules.find((m: any) => m.order_index === 1)?.id;
  const mod2Id = modules.find((m: any) => m.order_index === 2)?.id;

  if (mod1Id && mod2Id) {
    const { data: lessons, error: lessonError } = await supabase.from('lessons').insert([
      { course_id: courseId, module_id: mod1Id, title: 'Tư duy phản biện là gì?', lesson_type: 'video', order_index: 1, duration_minutes: 18, xp_on_complete: 20, is_prerequisite_unlock: true, content_body: 'Content for l1' },
      { course_id: courseId, module_id: mod1Id, title: 'Vì sao não người dễ bị lừa?', lesson_type: 'video', order_index: 2, duration_minutes: 22, xp_on_complete: 20, is_prerequisite_unlock: false, content_body: 'Content for l2' },
      { course_id: courseId, module_id: mod1Id, title: 'Bài kiểm tra Module 1', lesson_type: 'quiz', order_index: 3, duration_minutes: 10, xp_on_complete: 30, is_prerequisite_unlock: false, content_body: 'Quiz 1' },
      { course_id: courseId, module_id: mod2Id, title: '10 kiểu ngụy biện phổ biến nhất', lesson_type: 'video', order_index: 1, duration_minutes: 24, xp_on_complete: 20, is_prerequisite_unlock: false, content_body: 'Content for l4' },
      { course_id: courseId, module_id: mod2Id, title: 'Nhận biết ngụy biện trong thông tin hàng ngày', lesson_type: 'video', order_index: 2, duration_minutes: 20, xp_on_complete: 25, is_prerequisite_unlock: false, content_body: 'Content for l5' },
      { course_id: courseId, module_id: mod2Id, title: 'Thực hành: Phân tích bài báo', lesson_type: 'exercise', order_index: 3, duration_minutes: 15, xp_on_complete: 35, is_prerequisite_unlock: false, content_body: 'Project 1' },
      { course_id: courseId, module_id: mod2Id, title: 'Bài kiểm tra Module 2', lesson_type: 'quiz', order_index: 4, duration_minutes: 10, xp_on_complete: 40, is_prerequisite_unlock: false, content_body: 'Quiz 2' }
    ]).select();

    if (lessonError) {
      console.error('Error seeding lessons:', lessonError);
    } else {
      console.log('Inserted lessons:', lessons.length);
    }
  }

  console.log('Seeding complete.');
}

seed();
