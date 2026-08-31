/**
 * Fail-closed secret loading. Never default, never use NEXT_PUBLIC_/VITE_ values.
 */

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string' || secret.trim().length < 16) {
    throw new Error('JWT_SECRET is required (minimum 16 characters). Refusing default or public secrets.');
  }
  return secret.trim();
}

export function getJwtSecretPrevious() {
  const secret = process.env.JWT_SECRET_PREVIOUS;
  if (!secret || typeof secret !== 'string' || secret.trim().length < 16) {
    return null;
  }
  return secret.trim();
}

export function assertJwtConfigured() {
  getJwtSecret();
}

export function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || typeof key !== 'string' || !key.trim()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required. No hardcoded fallback.');
  }
  return key.trim();
}

export function getSupabaseUrl() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return String(url).trim() || 'https://mmltqgekvpdnezqdavvc.supabase.co';
}
