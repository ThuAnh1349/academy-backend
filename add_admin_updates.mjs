import fs from 'fs';

const filePath = 'e:/HỌC DATA WITH NHILE/Academy/academy-backend/src/controllers/admin.controller.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const additionalMethods = `
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Category mock updated', id: req.params.key });
};

export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, slug, description, category, difficulty_level, xp_on_complete } = req.body;
    const updateData = { title, slug, description, category, difficulty_level, xp_on_complete: parseInt(xp_on_complete) || 0 };
    
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
`;

content = content + additionalMethods;

fs.writeFileSync(filePath, content);
console.log('Added UPDATE and MODULE endpoints to admin controller');
