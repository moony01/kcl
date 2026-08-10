import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260810000000_add_onboarding_completed.sql',
  ),
  'utf8',
);

describe('onboarding completion migration', () => {
  it('신규 프로필은 명시적 완료 전까지 false를 유지한다', () => {
    expect(migration).toMatch(
      /ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;/,
    );
    expect(migration).not.toMatch(/onboarding_completed_at|timestamptz/);
  });

  it('그룹 선택이 있거나 생성 후 상호작용한 legacy 프로필만 backfill한다', () => {
    expect(migration).toMatch(/SET onboarding_completed = true/);
    expect(migration).toMatch(/WHERE onboarding_completed = false/);
    expect(migration).toMatch(/favorite_group_id IS NOT NULL/);
    expect(migration).toMatch(
      /updated_at > created_at \+ interval '1 second'/,
    );
  });
});
