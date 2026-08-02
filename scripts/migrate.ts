/* eslint-disable @typescript-eslint/ban-ts-comment -- legacy migration script uses unchecked Supabase types */
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module dirname polyfill
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQL 파일 경로 (워크스페이스 루트 기준 doc 폴더)
// packages/kcl/scripts/migrate.ts -> ../../../doc/project/kcl/migrations/001_create_tables.sql
const MIGRATION_FILE_PATH = path.resolve(
  __dirname,
  '../../../doc/project/kcl/migrations/001_create_tables.sql',
);

async function main() {
  console.log('🔧 [Max] Database Migration Tool');
  console.log('========================================');

  if (!fs.existsSync(MIGRATION_FILE_PATH)) {
    console.error(`❌ Error: Migration file not found at ${MIGRATION_FILE_PATH}`);
    process.exit(1);
  }

  console.log(`📄 Reading migration file: ${MIGRATION_FILE_PATH}`);
  const sqlContent = fs.readFileSync(MIGRATION_FILE_PATH, 'utf-8');

  console.log('\n📋 Migration SQL Preview:');
  console.log('----------------------------------------');
  console.log(sqlContent.substring(0, 500) + '\n... (truncated) ...');
  console.log('----------------------------------------');

  console.log('\n🚀 Instructions for Supabase Studio:');
  console.log('1. Copy the full content of the SQL file.');
  console.log('2. Go to Supabase Dashboard -> SQL Editor.');
  console.log('3. Paste the SQL and Click "Run".');
  console.log('\n💡 Full path for copy-paste:');
  console.log(MIGRATION_FILE_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
