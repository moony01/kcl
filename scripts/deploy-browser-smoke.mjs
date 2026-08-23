#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const DEFAULT_PORT = process.env.DEPLOY_BROWSER_PORT || '3119';
const DEFAULT_BASE_URL = `http://127.0.0.1:${DEFAULT_PORT}`;
const NEWS_SLUG = '2026-rookie-boy-group-war-big4-debut-battle';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function getBrowserExecutablePath() {
  const candidates = [
    process.env.DEPLOY_BROWSER_PATH,
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) || null;
}

function describeError(error) {
  return error instanceof Error ? error.message : String(error);
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next dev server exited before readiness (code ${child.exitCode}).`);
    }

    try {
      const response = await fetch(`${baseUrl}/ko?deploy-browser-smoke=ready`);
      if (response.status < 500) return;
    } catch {
      // Keep polling until the dev server is ready.
    }

    await delay(250);
  }

  throw new Error('Next dev server was not ready after 120 seconds.');
}

function stopServer(child) {
  if (child.exitCode !== null) return;
  try {
    if (process.platform !== 'win32' && child.pid) {
      process.kill(-child.pid, 'SIGTERM');
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    // The process may exit between the check and the signal.
  }
}

async function startServer() {
  const configuredBaseUrl = process.env.DEPLOY_BROWSER_BASE_URL;
  if (configuredBaseUrl) {
    return { baseUrl: configuredBaseUrl.replace(/\/+$/, ''), child: null };
  }

  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const child = spawn(command, ['dev', '--hostname', '127.0.0.1', '--port', DEFAULT_PORT], {
    cwd: process.cwd(),
    env: process.env,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => process.stdout.write(`[dev] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[dev] ${chunk}`));

  const baseUrl = DEFAULT_BASE_URL;
  try {
    await waitForServer(baseUrl, child);
  } catch (error) {
    stopServer(child);
    throw error;
  }
  return { baseUrl, child };
}

function isIgnorableConsoleError(message) {
  return (
    message.includes('AdSense head tag') ||
    message.includes('googlesyndication.com') ||
    message.includes('google-analytics.com') ||
    message.includes('Failed to load resource:')
  );
}

async function main() {
  const browserPath = getBrowserExecutablePath();
  if (!browserPath) {
    throw new Error(
      'No Chromium executable found. Set DEPLOY_BROWSER_PATH to a Chromium/Chrome executable.',
    );
  }

  const server = await startServer();
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: browserPath,
      headless: process.env.DEPLOY_BROWSER_HEADLESS !== 'false',
      args: process.platform === 'linux' ? ['--no-sandbox'] : [],
    });

    const page = await browser.newPage({ locale: 'ko-KR', viewport: { width: 1440, height: 1000 } });
    const supabaseResponses = [];
    const appConsoleErrors = [];

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('.supabase.co/rest/v1/')) {
        supabaseResponses.push({ status: response.status(), url });
      }
    });
    page.on('console', (message) => {
      if (message.type() === 'error' && !isIgnorableConsoleError(message.text())) {
        appConsoleErrors.push(message.text());
      }
    });

    const homeResponse = await page.goto(`${server.baseUrl}/ko?deploy-browser-smoke=home`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });
    assert(homeResponse && homeResponse.status() < 500, `home returned HTTP ${homeResponse?.status()}`);
    await page.locator('[data-company-id]').first().waitFor({ state: 'visible', timeout: 20_000 });
    const companyCount = await page.locator('[data-company-id]').count();
    assert(companyCount > 0, 'home rendered no company cards');
    assert(!(await page.getByText('Failed to load data').count()), 'home rendered data-load failure');

    const newsResponse = await page.goto(`${server.baseUrl}/en/news?deploy-browser-smoke=news`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });
    assert(newsResponse && newsResponse.status() < 500, `news list returned HTTP ${newsResponse?.status()}`);
    const newsImage = page.locator('img[src*="/images/news/"]').first();
    const imageSources = await page.locator('img').evaluateAll((images) =>
      images.map((image) => image.getAttribute('src') || '').filter((src) => src.includes('/images/news/')),
    );
    assert(imageSources.length > 0, 'news list rendered no news image');
    assert(
      imageSources.some((src) => /\.webp(?:$|\?)/i.test(src) || /nextImageExportOptimizer/i.test(src)),
      `news image is not WebP-backed: ${imageSources[0]}`,
    );
    await newsImage.waitFor({ state: 'visible', timeout: 15_000 });

    const detailResponse = await page.goto(
      `${server.baseUrl}/ko/news/${NEWS_SLUG}?deploy-browser-smoke=detail`,
      { waitUntil: 'networkidle', timeout: 30_000 },
    );
    assert(detailResponse && detailResponse.status() < 500, `news detail returned HTTP ${detailResponse?.status()}`);
    const detailMain = page.getByRole('main').last();
    assert((await detailMain.innerText()).length > 300, 'news detail rendered insufficient content');

    const successfulSupabaseRequest = supabaseResponses.some(
      ({ status }) => status >= 200 && status < 300,
    );
    assert(successfulSupabaseRequest, 'no successful Supabase REST response was observed');
    assert(
      appConsoleErrors.length === 0,
      `browser console reported application errors: ${appConsoleErrors.slice(0, 3).join(' | ')}`,
    );

    console.log(
      JSON.stringify(
        {
          status: 'PASS',
          browser: browserPath,
          baseUrl: server.baseUrl,
          companyCount,
          supabaseResponses: supabaseResponses.map(({ status, url }) => ({ status, url })),
          newsImage: imageSources[0],
        },
        null,
        2,
      ),
    );
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopServer(server.child);
  }
}

try {
  await main();
} catch (error) {
  console.error(`DEPLOY BROWSER SMOKE FAILED: ${describeError(error)}`);
  process.exitCode = 1;
}
