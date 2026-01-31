/**
 * PWA 아이콘 생성 스크립트
 * logo_white.png를 기반으로 192x192, 512x512 아이콘 생성
 *
 * @usage node scripts/generate-icons.js
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SOURCE_LOGO = path.join(PUBLIC_DIR, 'logo_white.png');

const ICON_SIZES = [192, 512];

async function generateIcons() {
  console.log('🎨 PWA 아이콘 생성 시작...\n');

  for (const size of ICON_SIZES) {
    const outputPath = path.join(PUBLIC_DIR, `icon-${size}.png`);

    await sharp(SOURCE_LOGO)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 10, g: 10, b: 10, alpha: 1 } // #0a0a0a 배경
      })
      .png()
      .toFile(outputPath);

    console.log(`  ✅ icon-${size}.png 생성 완료`);
  }

  console.log('\n🎉 모든 아이콘 생성 완료!');
}

generateIcons().catch(console.error);
