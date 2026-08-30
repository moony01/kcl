import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260829020000_rename_profile_tables_to_kcl.sql'),
  'utf8',
);

describe('profile table namespace migration', () => {
  it('renames profile tables and owned objects to product-level names', () => {
    expect(migration).toContain('RENAME TO profile_activities');
    expect(migration).toContain('RENAME TO profile_posts');
    expect(migration).toContain('RENAME TO profile_content_set_updated_at');
    expect(migration).toContain('RENAME TO profile_activities_public_read');
    expect(migration).toContain('RENAME TO profile_posts_public_read');
  });
});
