/**
 * 이미지 WebP 변환 스크립트
 *
 * PNG, JPG, JPEG 파일을 WebP 포맷으로 변환합니다.
 *
 * @example
 * ```bash
 * # 단일 파일 변환
 * node scripts/convert-to-webp.js public/images/news/example.png
 *
 * # 디렉토리 전체 변환
 * node scripts/convert-to-webp.js public/images/news/
 * ```
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 설정
const CONFIG = {
  quality: 80, // WebP 품질 (0-100)
  lossless: false, // 무손실 압축
  keepOriginal: true, // 원본 파일 유지
};

// 지원 확장자
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환
 * @param {number} bytes - 바이트 수
 * @returns {string} 포맷된 문자열
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * 단일 파일을 WebP로 변환
 * @param {string} filePath - 변환할 파일 경로
 * @returns {Promise<{original: number, converted: number, saved: number}>}
 */
async function convertFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    console.log(`  ⏭️  스킵: ${path.basename(filePath)} (지원하지 않는 확장자)`);
    return null;
  }

  const outputPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');

  // 이미 WebP가 존재하면 스킵
  if (fs.existsSync(outputPath)) {
    console.log(`  ⏭️  스킵: ${path.basename(filePath)} (WebP 이미 존재)`);
    return null;
  }

  const originalSize = fs.statSync(filePath).size;

  try {
    await sharp(filePath)
      .webp({
        quality: CONFIG.quality,
        lossless: CONFIG.lossless,
      })
      .toFile(outputPath);

    const newSize = fs.statSync(outputPath).size;
    const savedPercent = ((1 - newSize / originalSize) * 100).toFixed(1);
    const savedBytes = originalSize - newSize;

    console.log(`  ✅ ${path.basename(filePath)} → ${path.basename(outputPath)}`);
    console.log(
      `     ${formatBytes(originalSize)} → ${formatBytes(newSize)} (${savedPercent}% 절감)`,
    );

    return {
      original: originalSize,
      converted: newSize,
      saved: savedBytes,
    };
  } catch (error) {
    console.error(`  ❌ 변환 실패: ${path.basename(filePath)} - ${error.message}`);
    return null;
  }
}

/**
 * 디렉토리의 모든 이미지를 WebP로 변환
 * @param {string} dirPath - 디렉토리 경로
 * @returns {Promise<{totalOriginal: number, totalConverted: number, fileCount: number}>}
 */
async function convertDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let totalOriginal = 0;
  let totalConverted = 0;
  let fileCount = 0;

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      const result = await convertFile(filePath);
      if (result) {
        totalOriginal += result.original;
        totalConverted += result.converted;
        fileCount++;
      }
    }
  }

  return { totalOriginal, totalConverted, fileCount };
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('\n🖼️  WebP 변환 시작...\n');

  const target = process.argv[2];

  if (!target) {
    console.log('사용법: node convert-to-webp.js <파일 또는 디렉토리>');
    console.log('');
    console.log('예시:');
    console.log('  node convert-to-webp.js public/images/news/example.png');
    console.log('  node convert-to-webp.js public/images/news/');
    process.exit(1);
  }

  // 상대 경로를 절대 경로로 변환
  const absolutePath = path.isAbsolute(target) ? target : path.join(__dirname, '..', target);

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ 경로를 찾을 수 없습니다: ${target}`);
    process.exit(1);
  }

  const stats = fs.statSync(absolutePath);

  if (stats.isDirectory()) {
    console.log(`📁 디렉토리: ${target}\n`);
    const result = await convertDirectory(absolutePath);

    if (result.fileCount > 0) {
      const totalSaved = result.totalOriginal - result.totalConverted;
      const savedPercent = ((totalSaved / result.totalOriginal) * 100).toFixed(1);

      console.log('\n📊 변환 결과:');
      console.log(`   파일 수: ${result.fileCount}개`);
      console.log(`   원본 크기: ${formatBytes(result.totalOriginal)}`);
      console.log(`   변환 후: ${formatBytes(result.totalConverted)}`);
      console.log(`   총 절감: ${formatBytes(totalSaved)} (${savedPercent}%)`);
    } else {
      console.log('\n⚠️  변환할 이미지가 없습니다.');
    }
  } else {
    console.log(`📄 파일: ${target}\n`);
    await convertFile(absolutePath);
  }

  console.log('\n✅ 완료!\n');
}

// 스크립트 실행
main().catch((error) => {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
});
