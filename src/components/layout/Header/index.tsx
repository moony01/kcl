'use client';

/**
 * Header - 상단 헤더 컴포넌트
 *
 * 모바일에서는 로고 + 컨트롤 영역을 표시하고,
 * 데스크탑에서는 컨트롤 영역만 우측 상단에 표시합니다.
 *
 * AUTH_SYSTEM 활성화 시:
 * - 미인증: LogIn 아이콘
 * - 인증됨: 아바타 썸네일
 * - ThemeToggle과 LangSelect 사이에 배치
 */

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogIn, User } from 'lucide-react';
import styles from './Header.module.scss';
import ThemeToggle from '../../common/ThemeToggle';
import { FEATURES } from '@/config/features';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isAuthenticated } = useAuth();

  const changeLang = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <header className={styles.header}>
      {/* 모바일 로고 (데스크탑에서는 사이드바에 로고가 있으므로 숨김) */}
      <Link href="/" className={styles.logoWrapper}>
        <img
          src="/kcl-logo.svg"
          alt="KCL Logo"
          className={styles.logoIcon}
          width={28}
          height={28}
        />
        <span className={styles.logoText}>KCL</span>
      </Link>

      <div className={styles.controls}>
        {/* 테마 토글 버튼 (다크/라이트 모드 전환) */}
        <ThemeToggle compact className={styles.themeToggle} />

        {/* 프로필/로그인 버튼 (AUTH_SYSTEM 활성화 시) */}
        {FEATURES.AUTH_SYSTEM && (
          <Link
            href={`/${locale}${isAuthenticated ? '/my' : '/login'}`}
            className={styles.profileBtn}
          >
            {isAuthenticated && profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className={styles.profileAvatar}
              />
            ) : isAuthenticated ? (
              <User size={18} />
            ) : (
              <LogIn size={18} />
            )}
          </Link>
        )}

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
    </header>
  );
}
