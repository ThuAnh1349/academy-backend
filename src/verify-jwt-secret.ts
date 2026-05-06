/**
 * Verify JWT secret bằng cách tạo một JWT test với supabaseAdmin
 * và verify nó với JWT secret trong .env
 */
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const secret = process.env.SUPABASE_JWT_SECRET!;
const supabaseUrl = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('\n=== Verify JWT Secret ===');
console.log('Supabase URL:', supabaseUrl);
console.log('JWT Secret (raw):', secret.substring(0, 30) + '...');
console.log('JWT Secret length:', secret.length);

// Decode service_role key để xem nó ký với gì
const serviceDecoded = jwt.decode(serviceKey, { complete: true });
console.log('\nService Role Key header:', JSON.stringify(serviceDecoded?.header));
console.log('Service Role Key payload.role:', (serviceDecoded?.payload as any)?.role);

// Thử verify service_role key với secret (nó cũng được sign bởi Supabase)
console.log('\n--- Verifying service_role key với raw secret ---');
try {
  jwt.verify(serviceKey, secret);
  console.log('✅ Raw string secret WORKS!');
} catch (e: any) {
  console.error('❌ Raw string failed:', e.message);
}

console.log('\n--- Verifying service_role key với base64 decoded secret ---');
try {
  const buf = Buffer.from(secret, 'base64');
  jwt.verify(serviceKey, buf);
  console.log('✅ Base64 decoded secret WORKS!');
} catch (e: any) {
  console.error('❌ Base64 decoded failed:', e.message);
}

// Thử lấy một user token thực sự
const supabase = createClient(supabaseUrl, serviceKey);

async function testWithRealUser() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const adminUser = users.find(u => u.app_metadata?.role === 'admin');
  
  if (!adminUser) {
    console.log('\n⚠️  Không tìm thấy admin user để test token thực');
    return;
  }

  // Tạo magic link để lấy token (không gửi email)
  const { data: linkData, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: adminUser.email!,
  });

  if (error || !linkData?.properties?.access_token) {
    console.log('\n⚠️  Không tạo được test token:', error?.message);
    return;
  }

  const testToken = linkData.properties.access_token;
  console.log('\n--- Verifying REAL admin token với raw secret ---');
  try {
    const result = jwt.verify(testToken, secret) as any;
    console.log('✅ Raw string secret WORKS with real token!');
    console.log('  app_metadata:', JSON.stringify(result.app_metadata));
  } catch (e: any) {
    console.error('❌ Raw string failed:', e.message);
    
    console.log('\n--- Verifying REAL admin token với base64 decoded secret ---');
    try {
      const buf = Buffer.from(secret, 'base64');
      const result = jwt.verify(testToken, buf) as any;
      console.log('✅ Base64 decoded secret WORKS with real token!');
      console.log('  app_metadata:', JSON.stringify(result.app_metadata));
    } catch (e2: any) {
      console.error('❌ Base64 decoded also failed:', e2.message);
      console.log('\n🔴 PROBLEM: JWT secret in .env does not match Supabase project JWT secret!');
      console.log('   Go to Supabase Dashboard → Project Settings → API → JWT Secret');
    }
  }
}

testWithRealUser().catch(console.error);
