/**
 * sitemap.xml에 XSL 스타일시트 참조 추가
 *
 * Next.js가 생성한 sitemap.xml에 XSL 스타일시트 참조를 주입합니다.
 * 빌드 후 실행되어 브라우저에서 예쁘게 보이도록 합니다.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SITEMAP_PATH = join(__dirname, '../out/sitemap.xml');
const XSL_REFERENCE = '<?xml-stylesheet type="text/xsl" href="/sitemap-style.xsl"?>';

function injectSitemapStyle() {
  console.log('📄 Sitemap 스타일시트 주입 시작...\n');

  // sitemap.xml 존재 확인
  if (!existsSync(SITEMAP_PATH)) {
    console.error('❌ sitemap.xml을 찾을 수 없습니다:', SITEMAP_PATH);
    process.exit(1);
  }

  // sitemap.xml 읽기
  let content = readFileSync(SITEMAP_PATH, 'utf-8');

  // 이미 스타일시트가 있는지 확인
  if (content.includes('xml-stylesheet')) {
    console.log('✅ 이미 스타일시트가 적용되어 있습니다.\n');
    return;
  }

  // XML 선언 다음에 XSL 참조 추가
  content = content.replace(
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<?xml version="1.0" encoding="UTF-8"?>\n${XSL_REFERENCE}`,
  );

  // 파일 저장
  writeFileSync(SITEMAP_PATH, content, 'utf-8');

  console.log('✅ Sitemap 스타일시트 주입 완료!');
  console.log(`   - 파일: ${SITEMAP_PATH}`);
  console.log(`   - 스타일: /sitemap-style.xsl\n`);
}

injectSitemapStyle();
