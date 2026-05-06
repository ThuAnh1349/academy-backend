/**
 * Script list tất cả users và role hiện tại
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listUsers() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`\n📋 Tổng cộng ${users.length} users:\n`);
  users.forEach((u, i) => {
    const role = u.app_metadata?.role || '(member - chưa set)';
    const userType = u.app_metadata?.user_type || '(community)';
    console.log(`${i + 1}. ${u.email}`);
    console.log(`   Role (app_metadata): ${role}`);
    console.log(`   user_type: ${userType}`);
    console.log(`   ID: ${u.id}`);
    console.log('');
  });
}

listUsers().catch(console.error);
