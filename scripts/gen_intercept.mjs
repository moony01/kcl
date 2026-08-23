#!/usr/bin/env node
/**
 * ChatGPT Image Gen - intercept AFTER prompt sent, skip cached images
 */
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2] || 'bts-arirang-animation-whitewash-howard-university-2026';
const outDir = 'C:/Users/mun01/workspace/kcl/public/images/news';

const prompts = {
  thumbnail: `Cinematic editorial 16:9, no text: seven young East Asian men in 1890s formal attire standing on the grand stone steps of a historic American university at golden hour, singing together, surrounded by a racially diverse crowd of Black and Asian faces looking on with wonder, warm amber lighting, epic historical documentary photography style, photorealistic`,
  body: `Cinematic editorial 16:9, no text: antique brass phonograph with a large recording horn on a wooden table in a sunlit university hall in 1896, surrounded by young Korean men in period formal coats and young Black American students in Victorian-era dress, a woman ethnologist carefully adjusting the recording device, warm candlelight and window light, historical documentary photography, photorealistic`
};

function log(m) { console.log(`[${new Date().toISOString()}] ${m}`); }
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ss(page, label) {
  await page.screenshot({ path: `${outDir}/_int_${slug}_${label}.png`, fullPage: false }).catch(() => {});
  log(`SS: ${label}`);
}

async function generateOne(context, type) {
  const outFile = type === 'thumbnail' ? `${slug}-thumbnail.webp` : `${slug}-1.webp`;
  const outPath = path.join(outDir, outFile);
  log(`\n=== ${type} ===`);

  const page = await context.newPage();

  let promptSentAt = null;
  const capturedAfterSend = [];

  // Intercept ALL image responses
  page.on('response', async (response) => {
    const url = response.url();
    if (
      (url.includes('estuary/content') || url.includes('oaiusercontent.com') || url.includes('backend-api/files')) &&
      promptSentAt !== null && // Only after prompt sent
      Date.now() - promptSentAt > 2000 // At least 2s after send
    ) {
      const ct = response.headers()['content-type'] || '';
      try {
        const buf = await response.body();
        if (buf.length > 50000) {
          log(`POST-SEND intercept: ${url.slice(-60)}, size=${buf.length}, type=${ct}`);
          capturedAfterSend.push({ url, buf, ct, ts: Date.now() });
        }
      } catch { /* */ }
    }
  });

  // Navigate to a brand new conversation — force gpt-4o (image-capable, not reasoning model)
  await page.goto('https://chatgpt.com/?model=gpt-4o', { waitUntil: 'load', timeout: 60000 });
  await sleep(15000); // Wait for Cloudflare "확인 중..." to auto-pass

  // Handle Cloudflare CAPTCHA — try clicking the turnstile iframe
  const cf = await page.locator('text=사람인지 확인하십시오').count();
  if (cf > 0) {
    log('Cloudflare Turnstile detected, attempting click...');
    try {
      // CF Turnstile is inside an iframe
      const frames = page.frames();
      for (const frame of frames) {
        if (frame.url().includes('challenges.cloudflare.com')) {
          await frame.locator('body').click({ timeout: 5000 });
          log('Clicked CF Turnstile iframe body');
          break;
        }
      }
    } catch { /* */ }
    // Also try clicking the widget on the main page
    try {
      const widget = page.locator('[class*="widget"], #cf-chl-widget, input[name*="cf-turnstile"]').first();
      if (await widget.count() > 0) await widget.click({ timeout: 3000 });
    } catch { /* */ }
    await sleep(12000); // Wait for CF to resolve
    // If still stuck, reload once
    const cfStill = await page.locator('text=사람인지 확인하십시오').count();
    if (cfStill > 0) {
      log('Still on CF after click, reloading...');
      await page.reload({ waitUntil: 'load' });
      await sleep(20000);
    }
  }

  // Also handle "확인 중..." auto-check still lingering
  const cfChecking = await page.locator('text=확인 중').count();
  if (cfChecking > 0) {
    log('Cloudflare still checking, waiting extra 20s...');
    await sleep(20000);
  }

  await ss(page, `${type}_0_home`);

  // Switch to GPT-4o — the model selector is the "Pro" button in the input area
  try {
    // Click the model selector button (shows as "Pro" or current model name)
    const modelBtn = page.locator('button:has-text("Pro"), button[data-testid="model-switcher-dropdown-button"], button[class*="model"]').first();
    if (await modelBtn.count() > 0) {
      await modelBtn.click({ timeout: 5000 });
      log('Clicked model selector');
      await sleep(1500);
      // Select GPT-4o from the dropdown
      const opt4o = page.locator('[role="menuitem"]:has-text("4o"), [role="option"]:has-text("4o"), li:has-text("GPT-4o"), button:has-text("GPT-4o")').first();
      if (await opt4o.count() > 0) {
        await opt4o.click({ timeout: 5000 });
        log('Switched to GPT-4o');
        await sleep(1000);
      } else {
        // Fall back to "Instant" mode (fast/non-reasoning, supports image gen)
        const optInstant = page.locator('[role="menuitem"]:has-text("Instant"), [role="option"]:has-text("Instant")').first();
        if (await optInstant.count() > 0) {
          await optInstant.click({ timeout: 5000 });
          log('Switched to Instant mode');
          await sleep(1000);
        } else {
          await page.keyboard.press('Escape');
        }
      }
    }
  } catch (e) { log(`Model switch error: ${e}`); }

  const input = page.locator('#prompt-textarea').first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.click();
  await sleep(300);
  await page.keyboard.type(prompts[type], { delay: 5 });
  log('Typed');

  await sleep(500);

  const sendBtn = page.locator('button[data-testid="send-button"]').first();
  if (await sendBtn.count() > 0 && await sendBtn.isEnabled()) {
    await sendBtn.click();
    log('Clicked send');
  } else {
    await page.keyboard.press('Enter');
    log('Enter');
  }

  promptSentAt = Date.now();
  log(`Prompt sent at ${new Date(promptSentAt).toISOString()}`);

  // Wait up to 5 minutes for the image
  const deadline = Date.now() + 300000;
  let lastCaptureCount = 0;

  while (Date.now() < deadline) {
    await sleep(8000);

    if (capturedAfterSend.length > lastCaptureCount) {
      lastCaptureCount = capturedAfterSend.length;
      log(`New capture! Total: ${capturedAfterSend.length}`);

      // Wait a bit more to see if a larger image comes in
      await sleep(5000);

      // Get the largest image
      const best = capturedAfterSend.reduce((a, b) => a.buf.length > b.buf.length ? a : b);
      log(`Best image: ${best.buf.length} bytes from ${best.url.slice(-60)}`);

      // Verify it's a real image (check magic bytes)
      const h = best.buf.slice(0, 8);
      const isPNG = h[0] === 137 && h[1] === 80 && h[2] === 78 && h[3] === 71;
      const isJPG = h[0] === 255 && h[1] === 216;
      log(`Magic bytes: PNG=${isPNG}, JPG=${isJPG}`);

      if ((isPNG || isJPG) && best.buf.length > 100000) {
        await sharp(best.buf).webp({ quality: 82, effort: 6 }).toFile(outPath);
        log(`SAVED: ${outPath} (${best.buf.length} bytes)`);
        await ss(page, `${type}_saved`);
        await page.close();
        return true;
      }
    }

    const stop = await page.locator('[data-testid="stop-button"], button[aria-label*="Stop"]').count();
    const rem = Math.round((deadline - Date.now()) / 1000);
    log(`Waiting (captured=${capturedAfterSend.length}, stop=${stop}, ${rem}s left)`);
  }

  await ss(page, `${type}_timeout`);
  await page.close();
  return false;
}

(async () => {
  log('Intercept v2 starting');

  // Delete old placeholder files
  for (const f of [`${slug}-thumbnail.webp`, `${slug}-1.webp`]) {
    const fp = path.join(outDir, f);
    if (fs.existsSync(fp)) { fs.unlinkSync(fp); log(`Deleted: ${f}`); }
  }

  const ctx = await chromium.launchPersistentContext('C:/Users/mun01/.playwright-mcp-profile', {
    channel: 'msedge', headless: false, viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
    ignoreDefaultArgs: ['--enable-automation'],
  });

  try {
    const t = await generateOne(ctx, 'thumbnail');
    await sleep(2000);
    const b = await generateOne(ctx, 'body');
    log(`\nFINAL: thumbnail=${t}, body=${b}`);
  } catch (e) {
    log(`Fatal: ${e.stack || e}`);
  } finally {
    await sleep(3000);
    await ctx.close();
  }
})();
