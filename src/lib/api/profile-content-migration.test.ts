import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260829010000_add_profile_content.sql'),
  'utf8',
);

describe('profile content migration', () => {
  it('creates owner-scoped activity and post tables', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.mearrow_profile_activities');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.mearrow_profile_posts');
    expect(migration).toContain('REFERENCES auth.users(id) ON DELETE CASCADE');
    expect(migration).toContain('auth.uid() = user_id');
  });

  it('creates separate public media buckets with explicit restrictions', () => {
    expect(migration).toContain("'profile-images'");
    expect(migration).toContain("'profile-shorts'");
    expect(migration).toContain('10485760');
    expect(migration).toContain("'video/mp4'");
    expect(migration).toContain('52428800');
    expect(migration).toContain('split_part(name, \'/\', 1) = auth.uid()::text');
    expect(migration).toContain("storage_path ~ ('^' || user_id::text || '/[^/]+$')");
    expect(migration).not.toContain('CREATE POLICY mearrow_profile_feed_public_read');
  });
});
