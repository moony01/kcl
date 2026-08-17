'use client';

/**
 * Header - 상단 헤더 컴포넌트
 *
 * 모바일: 로고 + 컨트롤 (480px 이상에서는 사이드바가 로고 대체)
 * LeagueHeader(h1)는 HomeClient에서 별도 렌더링
 */

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Header.module.scss';
import ThemeToggle from '../../common/ThemeToggle';
import { BRAND_KOREAN_NAME, BRAND_NAME, BRAND_MARK_PATH } from '@/lib/brand';

export default function Header() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const changeLang = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* 모바일 로고 (480px 이상에서는 사이드바에 로고가 있으므로 숨김) */}
        <Link
          href="/"
          className={styles.logoWrapper}
          aria-label={`${BRAND_NAME} (${BRAND_KOREAN_NAME}) 홈`}
        >
          <img
            src={BRAND_MARK_PATH}
            alt=""
            className={styles.logoIcon}
            width={28}
            height={28}
          />
          <span className={styles.logoText}>{BRAND_NAME}</span>
        </Link>

        <div className={styles.controls}>
        {/* 테마 토글 버튼 (다크/라이트 모드 전환) */}
        <ThemeToggle compact className={styles.themeToggle} />


        <select value={locale} onChange={changeLang} className={styles.langSelect}>
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="id">Bahasa Indonesia</option>
          <option value="tr">Türkçe</option>
          <option value="ja">日本語</option>
          <option value="zh">中文(简体)</option>
          <option value="es">Español</option>
          <option value="pt">Português</option>
          <option value="th">ภาษาไทย</option>
          <option value="vi">Tiếng Việt</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
        </div>
      </div>
    </header>
  );
}
