import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createAccount(email, password, role) {
  console.log(`\n🔍 Checking user: ${email}`);

  // Check if user exists
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return;
  }

  let user = users.find(u => u.email === email);
  
  if (!user) {
    console.log(`✨ Creating user: ${email}...`);
    const { data: createdData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role }
    });
    
    if (createError) {
      console.error('❌ Error creating user:', createError.message);
      return;
    }
    user = createdData.user;
    console.log(`✅ User ${email} created successfully with role ${role}.`);
  } else {
    console.log(`User ${email} already exists. Updating role to ${role}...`);
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password, // Reset password to ensure we know it
        app_metadata: {
          ...user.app_metadata,
          role: role,
        }
      }
    );
    if (updateError) {
      console.error('❌ Error updating user:', updateError.message);
      return;
    }
    console.log(`✅ User ${email} updated successfully with role ${role} and password reset.`);
  }
}

async function main() {
  await createAccount('admin@tester.com', 'Admin@123!', 'admin');
  await createAccount('student@tester.com', 'Student@123!', 'member');
  console.log('\n🎉 Finished creating test accounts!');
}

main().catch(console.error);
