import { spawnSync } from 'node:child_process';

// OpenNext invokes the app's build script. The image optimizer and sitemap
// stylesheet injection are Pages-only post-processing steps and expect `out/`.
if (process.env.NEXT_RUNTIME_TARGET === 'workers') {
  process.exit(0);
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const optimize = spawnSync(pnpm, ['exec', 'next-image-export-optimizer'], {
  stdio: 'inherit',
});

if (optimize.status !== 0) {
  process.exit(optimize.status ?? 1);
}

const sitemap = spawnSync(pnpm, ['exec', 'node', 'scripts/inject-sitemap-style.js'], {
  stdio: 'inherit',
});

process.exit(sitemap.status ?? 1);
