#!/usr/bin/env node
/**
 * ChatGPT Image Gen - intercept AFTER prompt sent, skip cached images
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2] || 'bts-arirang-grammy-hunt-2026';
const outDir = 'C:/Users/mun01/workspace/kcl/public/images/news';

const prompts = {
  thumbnail: `Cinematic editorial 16:9, no text: a gleaming Grammy Award trophy standing alone on a dark stage under a single dramatic spotlight, behind it a vast sold-out stadium with purple and gold light beams, BTS silhouettes visible in the background, sense of ambition and tension, photorealistic`,
  body: `Cinematic editorial 16:9, no text: seven young Korean men in stylish modern outfits standing on a massive concert stage at night, arms raised, stadium crowd of 260000 fans with phone lights stretching to the horizon, dramatic purple and white stage lighting, triumphant energy, photorealistic`
};

function log(m) { console.log(`[${new Date().toISOString()}] ${m}`); }
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ss(page, label) {
  await page.screenshot({ path: `${outDir}/_int_${slug}_${label}.png`, fullPage: false }).catch(() => {});
  log(`SS: ${label}`);
}

async function generateOne(context, type) {
  const outFile = type === 'thumbnail' ? `${slug}-thumbnail.png` : `${slug}-1.png`;
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

  // Navigate to a brand new conversation
  await page.goto('https://chatgpt.com/', { waitUntil: 'load', timeout: 60000 });
  await sleep(4000);

  // Handle Cloudflare
  const cf = await page.locator('text=사람인지 확인하십시오').count();
  if (cf > 0) {
    log('Cloudflare, reloading...');
    await page.reload({ waitUntil: 'load' });
    await sleep(5000);
  }

  await ss(page, `${type}_0_home`);

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
        fs.writeFileSync(outPath, best.buf);
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
  for (const f of [`${slug}-thumbnail.png`, `${slug}-1.png`]) {
    const fp = path.join(outDir, f);
    if (fs.existsSync(fp)) { fs.unlinkSync(fp); log(`Deleted: ${f}`); }
  }

  const ctx = await chromium.launchPersistentContext('C:/Users/mun01/.playwright-mcp-profile', {
    channel: 'msedge', headless: false, viewport: { width: 1440, height: 900 }
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
