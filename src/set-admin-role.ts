/**
 * Script để kiểm tra và set admin role trong app_metadata của Supabase
 * Chạy bằng: npx tsx src/set-admin-role.ts <email>
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAndSetAdmin(email: string) {
  console.log(`\n🔍 Checking user: ${email}`);

  // 1. Lấy user theo email
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return;
  }

  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error(`❌ Không tìm thấy user với email: ${email}`);
    return;
  }

  console.log('\n📋 Thông tin user hiện tại:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  user_metadata:', JSON.stringify(user.user_metadata, null, 2));
  console.log('  app_metadata:', JSON.stringify(user.app_metadata, null, 2));
  console.log('\n  ⚠️  Role hiện tại đọc từ app_metadata:', user.app_metadata?.role || 'member (không có)');

  // 2. Set admin role trong app_metadata
  console.log('\n🔧 Đang set role=admin trong app_metadata...');
  
  const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    {
      app_metadata: {
        ...user.app_metadata,
        role: 'admin',
        user_type: user.app_metadata?.user_type || 'internal',
      }
    }
  );

  if (updateError) {
    console.error('❌ Error updating user:', updateError.message);
    return;
  }

  console.log('✅ Đã set role=admin thành công!');
  console.log('  app_metadata mới:', JSON.stringify(updatedUser.user?.app_metadata, null, 2));
  console.log('\n⚡ Lưu ý: User cần đăng xuất & đăng nhập lại để JWT token mới được cấp với role=admin');
}

// Lấy email từ command line hoặc dùng email mặc định
const targetEmail = process.argv[2];
if (!targetEmail) {
  console.error('❌ Vui lòng cung cấp email: npx tsx src/set-admin-role.ts your@email.com');
  process.exit(1);
}

checkAndSetAdmin(targetEmail).catch(console.error);
