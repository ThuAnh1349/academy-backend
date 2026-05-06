import { supabaseAdmin } from './supabase'

// Gọi hàm này khi onboard admin mới
export async function setRole(userId: string, role: 'admin' | 'member') {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role }
  })
  if (error) throw error
  console.log(`Successfully set role ${role} for user ${userId}`)
}
