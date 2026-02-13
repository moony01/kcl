/**
 * prebuild 스크립트: 마크다운 뉴스 파일을 JSON으로 변환
 *
 * Edge Runtime에서는 fs, path 등 Node.js API를 사용할 수 없으므로,
 * 빌드 전에 마크다운 파일을 JSON으로 변환하여 import 가능하게 만듦
 *
 * 생성 파일:
 * - src/generated/news-meta.json: 목록용 메타데이터
 * - src/generated/news-content/{locale}/{slug}.json: 본문 포함 상세 데이터
 * - public/api/news.json: 외부 연동용 공개 API (영어, active 뉴스만)
 *
 * @example
 * ```bash
 * node scripts/generate-news-json.js
 * ```
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

// ES Module에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 경로 설정
const CONTENT_DIR = path.join(__dirname, '../src/content/news');
const OUTPUT_DIR = path.join(__dirname, '../src/generated');
const META_OUTPUT = path.join(OUTPUT_DIR, 'news-meta.json');
const CONTENT_OUTPUT_DIR = path.join(OUTPUT_DIR, 'news-content');
// 외부 연동용 공개 API JSON 경로
const PUBLIC_API_DIR = path.join(__dirname, '../public/api');
const PUBLIC_API_OUTPUT = path.join(PUBLIC_API_DIR, 'news.json');

/**
 * 디렉토리가 없으면 재귀적으로 생성
 * @param {string} dirPath - 생성할 디렉토리 경로
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  [생성] 디렉토리: ${path.relative(process.cwd(), dirPath)}`);
  }
}

/**
 * 마크다운 파일을 파싱하여 뉴스 데이터 객체 반환
 * @param {string} filePath - 마크다운 파일 경로
 * @param {string} locale - 언어 코드
 * @returns {Object} 뉴스 데이터 객체
 */
function parseNewsFile(filePath, locale) {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  // 파일명에서 slug 추출 (확장자 제거)
  const slug = path.basename(filePath, '.md');

  const result = {
    slug,
    locale,
    title: data.title || '제목 없음',
    excerpt: data.excerpt || '',
    date: data.date || new Date().toISOString().split('T')[0],
    category: data.category || 'General',
    thumbnail: data.thumbnail || null,
    content,
  };

  // active 필드가 명시적으로 false인 경우만 포함 (비활성화 뉴스)
  if (data.active === false) {
    result.active = false;
  }

  return result;
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log('\n📰 뉴스 JSON 생성 시작...\n');

  // 출력 디렉토리 생성
  ensureDir(OUTPUT_DIR);
  ensureDir(CONTENT_OUTPUT_DIR);

  // 콘텐츠 디렉토리 존재 확인
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`❌ 콘텐츠 디렉토리가 없습니다: ${CONTENT_DIR}`);
    process.exit(1);
  }

  // 모든 뉴스 메타데이터 수집
  const allNewsMeta = [];

  // 로케일 디렉토리 순회
  const localeDirs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  console.log(`  [발견] 로케일: ${localeDirs.join(', ')}`);

  for (const locale of localeDirs) {
    const localeDir = path.join(CONTENT_DIR, locale);
    const localeOutputDir = path.join(CONTENT_OUTPUT_DIR, locale);

    // 로케일별 출력 디렉토리 생성
    ensureDir(localeOutputDir);

    // 마크다운 파일 순회
    const mdFiles = fs.readdirSync(localeDir).filter((file) => file.endsWith('.md'));

    console.log(`  [처리] ${locale}: ${mdFiles.length}개 파일`);

    for (const mdFile of mdFiles) {
      const filePath = path.join(localeDir, mdFile);
      const newsData = parseNewsFile(filePath, locale);

      // 메타데이터 (목록용 - content 제외)
      const { content, ...meta } = newsData;
      allNewsMeta.push(meta);

      // 상세 데이터 (본문 포함)
      const contentOutputPath = path.join(localeOutputDir, `${newsData.slug}.json`);
      fs.writeFileSync(contentOutputPath, JSON.stringify(newsData, null, 2), 'utf8');
    }
  }

  // 메타데이터를 날짜순으로 정렬 (최신순)
  allNewsMeta.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // news-meta.json 저장
  fs.writeFileSync(META_OUTPUT, JSON.stringify(allNewsMeta, null, 2), 'utf8');

  // 외부 연동용 공개 API JSON 생성 (영어 + active 뉴스만)
  ensureDir(PUBLIC_API_DIR);
  const publicApiData = allNewsMeta
    .filter((item) => item.locale === 'en' && item.active !== false)
    .map((item) => ({
      title: item.title,
      summary: item.excerpt,
      slug: item.slug,
      date: item.date,
      category: item.category,
      url: `https://www.kclhq.com/en/news/${item.slug}`,
    }));
  fs.writeFileSync(PUBLIC_API_OUTPUT, JSON.stringify(publicApiData, null, 2), 'utf8');

  console.log(`\n✅ 생성 완료!`);
  console.log(`   - 메타데이터: ${path.relative(process.cwd(), META_OUTPUT)}`);
  console.log(`   - 콘텐츠: ${path.relative(process.cwd(), CONTENT_OUTPUT_DIR)}/`);
  console.log(`   - 공개 API: ${path.relative(process.cwd(), PUBLIC_API_OUTPUT)} (${publicApiData.length}개)`);
  console.log(`   - 총 ${allNewsMeta.length}개 뉴스 처리됨\n`);
}

// 스크립트 실행
main();
