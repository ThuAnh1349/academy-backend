import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Lỗi: Chưa cấu hình biến môi trường Supabase ở Backend!');
}

// Ở Backend, chúng ta dùng service_role key để có quyền admin (bỏ qua RLS khi cần thiết)
export const supabase = createClient(supabaseUrl, supabaseKey);
