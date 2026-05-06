import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(url, key);

async function test() {
  console.log('Testing Database Connection...');
  const { data: courses, error: err1 } = await supabase.from('courses').select('slug').limit(1);
  console.log('Courses:', err1 ? err1 : courses);

  const { data: lp, error: err2 } = await supabase.from('lesson_progress').select('id').limit(1);
  console.log('Lesson Progress:', err2 ? err2 : lp);

  const { data: uc, error: err3 } = await supabase.from('user_certificates').select('id').limit(1);
  console.log('User Certificates:', err3 ? err3 : uc);
}

test();
