import fs from 'fs';
import path from 'path';

const filePath = 'e:/HỌC DATA WITH NHILE/Academy/academy-backend/src/controllers/admin.controller.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const replacement = `
import fs from 'fs';
import path from 'path';

const CATEGORIES_FILE = path.join(__dirname, '../../data/categories.json');

// Helper to ensure data file exists
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
    
    // Check if exists
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
`;

// Remove old getCategories and createCategory
content = content.replace(/export const getCategories = async.*?};/s, '');
content = content.replace(/export const createCategory = async.*?};/s, '');

// Insert the new logic after imports
content = content.replace(/import { supabaseAdmin } from '\.\.\/config\/supabase';/, "import { supabaseAdmin } from '../config/supabase';\n" + replacement);

fs.writeFileSync(filePath, content);
console.log('Replaced category endpoints with JSON store');
