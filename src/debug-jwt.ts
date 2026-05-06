/**
 * Debug script: decode một JWT token từ frontend và verify với JWT secret
 * Chạy: npx tsx src/debug-jwt.ts <token>
 */
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

const token = process.argv[2];
if (!token) {
  console.error('Usage: npx tsx src/debug-jwt.ts <jwt_token>');
  process.exit(1);
}

const secret = process.env.SUPABASE_JWT_SECRET!;

console.log('\n=== JWT Debug ===');
console.log('Secret (raw):', secret.substring(0, 20) + '...');
console.log('Token (first 50):', token.substring(0, 50) + '...\n');

// 1. Decode without verify để xem payload
try {
  const decoded = jwt.decode(token, { complete: true });
  console.log('✅ Decoded (no verify):');
  console.log('  Header:', JSON.stringify(decoded?.header));
  console.log('  Payload sub:', (decoded?.payload as any)?.sub);
  console.log('  Payload email:', (decoded?.payload as any)?.email);
  console.log('  Payload app_metadata:', JSON.stringify((decoded?.payload as any)?.app_metadata));
  console.log('  Expires:', new Date(((decoded?.payload as any)?.exp || 0) * 1000).toISOString());
  console.log('  Issued:', new Date(((decoded?.payload as any)?.iat || 0) * 1000).toISOString());
} catch (e: any) {
  console.error('❌ Decode failed:', e.message);
}

// 2. Thử verify với secret as-is (string)
console.log('\n--- Attempt 1: verify with raw string secret ---');
try {
  const result = jwt.verify(token, secret);
  console.log('✅ SUCCESS with raw string secret!');
  console.log('  role:', (result as any).app_metadata?.role);
} catch (e: any) {
  console.error('❌ FAILED:', e.message);
}

// 3. Thử verify với base64 decoded secret
console.log('\n--- Attempt 2: verify with base64-decoded secret ---');
try {
  const secretBuffer = Buffer.from(secret, 'base64');
  const result = jwt.verify(token, secretBuffer);
  console.log('✅ SUCCESS with base64-decoded secret!');
  console.log('  role:', (result as any).app_metadata?.role);
} catch (e: any) {
  console.error('❌ FAILED:', e.message);
}

console.log('\n=== End Debug ===\n');
