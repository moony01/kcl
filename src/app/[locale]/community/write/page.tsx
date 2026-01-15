import { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ArrowLeft, PenSquare } from 'lucide-react';
import { PostForm } from '@/components/features/community';
import styles from './page.module.scss';

/**
 * 글쓰기 페이지 Props
 */
interface WritePageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * 페이지 메타데이터 생성
 */
export async function generateMetadata({ params }: WritePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Community' });

  return {
    title: `${t('write')} - ${t('title')}`,
    description: t('subtitle'),
  };
}

/**
 * 글쓰기 페이지
 */
export default async function WritePage({ params }: WritePageProps) {
  const { locale } = await params;

  // next-intl 정적 생성 지원
  setRequestLocale(locale);

  // 번역 가져오기
  const t = await getTranslations({ locale, namespace: 'Community' });

  return (
    <main className={styles.container}>
      {/* 헤더 */}
      <header className={styles.header}>
        <Link href={`/${locale}/community`} className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>{t('back_to_list')}</span>
        </Link>
        <div className={styles.titleWrapper}>
          <PenSquare size={24} className={styles.icon} />
          <h1 className={styles.title}>{t('write')}</h1>
        </div>
      </header>

      {/* 글쓰기 폼 */}
      <PostForm locale={locale} />
    </main>
  );
}
