import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * 뉴스 게시글 타입 정의
 * 마크다운 파일의 frontmatter와 본문을 포함
 */
export interface NewsPost {
  /** URL용 식별자 (파일명에서 .md 제외) */
  slug: string;
  /** 기사 제목 */
  title: string;
  /** 기사 요약문 (목록 카드용) */
  excerpt: string;
  /** 작성일 (YYYY-MM-DD) */
  date: string;
  /** 마크다운 본문 */
  content: string;
  /** 썸네일 이미지 경로 */
  thumbnail?: string;
  /** 카테고리 */
  category?: string;
  /** 언어 코드 */
  locale: string;
}

/**
 * 뉴스 콘텐츠가 저장된 기본 경로
 * packages/kcl/src/content/news/
 */
const getContentDirectory = () => {
  return path.join(process.cwd(), 'src/content/news');
};

/**
 * 특정 언어(locale)의 모든 뉴스 게시글을 가져옵니다.
 * 날짜순(최신순)으로 정렬하여 반환합니다.
 *
 * @param locale - 언어 코드 (기본값: 'ko')
 * @returns 뉴스 게시글 배열
 */
export function getAllNews(locale: string = 'ko'): NewsPost[] {
  const contentDirectory = getContentDirectory();
  const targetDirectory = path.join(contentDirectory, locale);

  // 디렉토리가 없으면 빈 배열 반환 (에러 방지)
  if (!fs.existsSync(targetDirectory)) {
    // 해당 언어 콘텐츠가 없으면 영어로 fallback
    const fallbackDirectory = path.join(contentDirectory, 'en');
    if (locale !== 'en' && fs.existsSync(fallbackDirectory)) {
      return getAllNews('en');
    }
    return [];
  }

  const fileNames = fs.readdirSync(targetDirectory);
  const allNewsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      // 파일명에서 ".md" 확장자 제거하여 slug 생성
      const slug = fileName.replace(/\.md$/, '');

      // 마크다운 파일 읽기
      const fullPath = path.join(targetDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // gray-matter로 메타데이터(frontmatter)와 본문 파싱
      const { data, content } = matter(fileContents);

      return {
        slug,
        content,
        title: data.title || '제목 없음',
        excerpt: data.excerpt || '',
        date: data.date || new Date().toISOString().split('T')[0],
        thumbnail: data.thumbnail || null,
        category: data.category || 'General',
        locale,
      } as NewsPost;
    });

  // 날짜 내림차순(최신순) 정렬
  return allNewsData.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * 슬러그(URL ID)로 특정 뉴스 상세 정보를 가져옵니다.
 *
 * @param slug - 뉴스 식별자
 * @param locale - 언어 코드 (기본값: 'ko')
 * @returns 뉴스 게시글 또는 null
 */
export function getNewsBySlug(slug: string, locale: string = 'ko'): NewsPost | null {
  const contentDirectory = getContentDirectory();
  let fullPath = path.join(contentDirectory, locale, `${slug}.md`);

  // 해당 언어 파일이 없으면 영어로 fallback
  if (!fs.existsSync(fullPath)) {
    if (locale !== 'en') {
      fullPath = path.join(contentDirectory, 'en', `${slug}.md`);
      if (!fs.existsSync(fullPath)) {
        return null;
      }
    } else {
      return null;
    }
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    content,
    title: data.title || '제목 없음',
    excerpt: data.excerpt || '',
    date: data.date || new Date().toISOString().split('T')[0],
    thumbnail: data.thumbnail || null,
    category: data.category || 'General',
    locale,
  } as NewsPost;
}

/**
 * 모든 뉴스 슬러그를 가져옵니다.
 * generateStaticParams에서 사용
 *
 * @param locale - 언어 코드
 * @returns 슬러그 배열
 */
export function getAllNewsSlugs(locale: string = 'ko'): string[] {
  const posts = getAllNews(locale);
  return posts.map((post) => post.slug);
}
