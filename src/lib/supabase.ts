import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

// Client thường — bị giới hạn bởi RLS
// Dùng để: verify session, query public data
export const supabaseAnon = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Client admin — bypass RLS hoàn toàn
// Dùng CHỈ cho:
//   - Upsert vào bảng users (sync-user endpoint)
//   - INSERT vào xp_ledger
//   - Validate quiz: đọc is_correct từ quiz_options table gốc
//   - Script set role
// KHÔNG dùng để fetch data thông thường cho user
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
