/**
 * JSON-LD 구조화 데이터 컴포넌트
 *
 * SEO를 위한 JSON-LD 스키마를 <script type="application/ld+json">로 렌더링
 * Google Rich Snippet 노출을 위한 구조화 데이터 제공
 *
 * @example
 * ```tsx
 * <JsonLd data={{
 *   "@context": "https://schema.org",
 *   "@type": "WebSite",
 *   "name": "KCL"
 * }} />
 * ```
 */

interface JsonLdProps {
  /** JSON-LD 스키마 데이터 */
  data: Record<string, unknown>;
}

/**
 * JSON-LD 스크립트 태그를 렌더링하는 컴포넌트
 * @param data - JSON-LD 형식의 구조화 데이터 객체
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export default JsonLd;
