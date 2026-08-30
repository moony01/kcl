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

async function assertSeoEndpoints(baseUrl) {
  const canonicalSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://mearrow.com').replace(
    /\/+$/,
    '',
  );
  const [robotsResponse, sitemapResponse] = await Promise.all([
    fetch(`${baseUrl}/robots.txt`),
    fetch(`${baseUrl}/sitemap.xml`),
  ]);
  const robotsText = await robotsResponse.text();
  const sitemapText = await sitemapResponse.text();

  assert(robotsResponse.status < 500, `robots.txt returned HTTP ${robotsResponse.status}`);
  assert(sitemapResponse.status < 500, `sitemap.xml returned HTTP ${sitemapResponse.status}`);
  assert(
    robotsText.includes(`Sitemap: ${canonicalSiteUrl}/sitemap.xml`),
    `robots.txt does not point to ${canonicalSiteUrl}/sitemap.xml`,
  );
  assert(
    sitemapText.includes(`<loc>${canonicalSiteUrl}/`),
    `sitemap.xml does not contain ${canonicalSiteUrl} URLs`,
  );
  assert(!/https?:\/\/(?:www\.)?kclhq\.com/i.test(`${robotsText}\n${sitemapText}`),
    'robots.txt or sitemap.xml still contains the legacy kclhq.com host');

  return {
    canonicalSiteUrl,
    robotsStatus: robotsResponse.status,
    sitemapStatus: sitemapResponse.status,
  };
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
  if (!child || child.exitCode !== null) return;
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
    // React Grab is dev-only; its unpkg script can emit a CORS error in CI.
    (message.includes('unpkg.com/react-grab/dist/index.global.js') &&
      message.includes('CORS policy')) ||
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
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    assert(homeResponse && homeResponse.status() < 500, `home returned HTTP ${homeResponse?.status()}`);
    await page.locator('[data-testid="home-profile-feed"]').waitFor({ state: 'visible', timeout: 20_000 });
    await page.waitForFunction(
      () => {
        const root = document.querySelector('[data-testid="home-profile-feed"]');
        return Boolean(
          root?.querySelector(
            '[data-testid="profile-feed-card"], [data-testid="profile-feed-empty"], [role="alert"]',
          ),
        );
      },
      undefined,
      { timeout: 20_000 },
    );
    const profileFeedCount = await page.locator('[data-testid="profile-feed-card"]').count();
    assert(
      supabaseResponses.some(
        ({ status, url }) => url.includes('/rest/v1/profile_posts') && status >= 200 && status < 300,
      ),
      'home did not successfully query the public profile feed',
    );
    assert(
      !(await page.locator('[data-testid="home-profile-feed"] [role="alert"]').count()),
      'home rendered public feed data-load failure',
    );
    const rankingResponse = await page.goto(`${server.baseUrl}/ko/ranking?deploy-browser-smoke=ranking`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    assert(rankingResponse && rankingResponse.status() < 500, `ranking returned HTTP ${rankingResponse?.status()}`);
    await page.locator('[data-company-id]').first().waitFor({ state: 'visible', timeout: 20_000 });
    const companyCount = await page.locator('[data-company-id]').count();
    assert(companyCount > 0, 'ranking rendered no company cards');
    assert(!(await page.getByText('Failed to load data').count()), 'ranking rendered data-load failure');
    const seoEndpoints = await assertSeoEndpoints(server.baseUrl);

    const newsResponse = await page.goto(`${server.baseUrl}/en/news?deploy-browser-smoke=news`, {
      waitUntil: 'domcontentloaded',
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
    await page.waitForFunction(
      () => {
        const image = document.querySelector('img[src*="/images/news/"]');
        return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
      },
      undefined,
      { timeout: 15_000 },
    );
    const firstNewsImageLoaded = await newsImage.evaluate((image) => image.complete && image.naturalWidth > 0);
    assert(firstNewsImageLoaded, `news image failed to load: ${imageSources[0]}`);

    const detailResponse = await page.goto(
      `${server.baseUrl}/ko/news/${NEWS_SLUG}?deploy-browser-smoke=detail`,
      { waitUntil: 'domcontentloaded', timeout: 30_000 },
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
          profileFeedCount,
          companyCount,
          ...seoEndpoints,
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
