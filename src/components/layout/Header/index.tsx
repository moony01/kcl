'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Header.module.scss';
import ThemeToggle from '../../common/ThemeToggle';

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
      {/* 
        Logo is mainly handled by Sidebar on Desktop. 
        On Mobile, we might want to keep KCL logo or title.
        But for now, Sidebar is hidden on mobile, so we need a header? 
        Actually, AppShell Logic:
        Sidebar (Desktop) / BottomNav (Mobile).
        If BottomNav is used, where is the top bar? 
        Instagram has a top bar on mobile with kcl logo.
        So let's keep logo but remove Theme Toggle as requested.
      */}
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
