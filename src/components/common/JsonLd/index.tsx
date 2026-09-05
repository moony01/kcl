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
 *   "name": "MEARROW"
 * }} />
 * ```
 */

interface JsonLdProps {
  /** JSON-LD 스키마 데이터 */
  data: Record<string, unknown>;
}

/**
 * JSON-LD는 HTML script 안에 삽입되므로 `<`를 그대로 출력하면
 * 데이터 안의 `</script>`가 부모 스크립트를 조기 종료할 수 있습니다.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * JSON-LD 스크립트 태그를 렌더링하는 컴포넌트
 * @param data - JSON-LD 형식의 구조화 데이터 객체
 */
export function JsonLd({ data }: JsonLdProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

export default JsonLd;
