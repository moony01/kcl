import { spawnSync } from 'node:child_process';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const clean = spawnSync(pnpm, ['clean:build'], {
  stdio: 'inherit',
});

if (clean.status !== 0) {
  process.exit(clean.status ?? 1);
}

const build = spawnSync(pnpm, ['exec', 'opennextjs-cloudflare', 'build'], {
  env: {
    ...process.env,
    NEXT_RUNTIME_TARGET: 'workers',
  },
  stdio: 'inherit',
});

process.exit(build.status ?? 1);
