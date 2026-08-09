'use client';

import { ArrowRight, Megaphone } from 'lucide-react';
import classNames from 'classnames';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import styles from './KpopfaceAdCard.module.scss';

const KPOPFACE_URL = 'https://moony01.com/kpopface/';

type KpopfaceAdCopy = {
  label: string;
  title: string;
  subtitle: string;
  action: string;
  ariaLabel: string;
};

const KPOPFACE_AD_COPY: Record<string, KpopfaceAdCopy> = {
  ko: {
    label: '광고',
    title: 'SM vs. YG vs. JYP 얼굴상 매치',
    subtitle: '10만+ 아이돌 이미지 학습 AI',
    action: '무료 테스트',
    ariaLabel: 'K-pop 얼굴상 무료 테스트 열기',
  },
  en: {
    label: 'AD',
    title: 'SM vs. YG vs. JYP Face Match',
    subtitle: 'AI trained on 100K+ idol images',
    action: 'Free test',
    ariaLabel: 'Open the free K-pop face match test',
  },
  id: {
    label: 'IKLAN',
    title: 'Face Match SM vs. YG vs. JYP',
    subtitle: 'AI yang dilatih dengan 100 ribu+ gambar idol',
    action: 'Tes gratis',
    ariaLabel: 'Buka tes Face Match K-pop gratis',
  },
  tr: {
    label: 'REKLAM',
    title: 'SM vs. YG vs. JYP Yüz Eşleşmesi',
    subtitle: '100 binden fazla idol görseliyle eğitilmiş yapay zekâ',
    action: 'Ücretsiz test',
    ariaLabel: 'Ücretsiz K-pop yüz eşleşmesi testini aç',
  },
  ja: {
    label: '広告',
    title: 'SM vs. YG vs. JYP 顔タイプマッチ',
    subtitle: '10万枚以上のアイドル画像で学習したAI',
    action: '無料テスト',
    ariaLabel: 'K-pop顔タイプの無料テストを開く',
  },
  zh: {
    label: '广告',
    title: 'SM vs. YG vs. JYP 颜值匹配',
    subtitle: '基于10万+偶像图片训练的AI',
    action: '免费测试',
    ariaLabel: '打开免费的K-pop颜值匹配测试',
  },
  pt: {
    label: 'ANÚNCIO',
    title: 'Face Match: SM vs. YG vs. JYP',
    subtitle: 'IA treinada com mais de 100 mil imagens de idols',
    action: 'Teste grátis',
    ariaLabel: 'Abrir o teste gratuito de Face Match K-pop',
  },
  th: {
    label: 'โฆษณา',
    title: 'SM vs. YG vs. JYP จับคู่ใบหน้า',
    subtitle: 'AI ที่ฝึกด้วยภาพไอดอลกว่า 100,000 ภาพ',
    action: 'ทดสอบฟรี',
    ariaLabel: 'เปิดแบบทดสอบจับคู่ใบหน้า K-pop ฟรี',
  },
  vi: {
    label: 'QUẢNG CÁO',
    title: 'Face Match: SM vs. YG vs. JYP',
    subtitle: 'AI được huấn luyện với hơn 100.000 ảnh idol',
    action: 'Test miễn phí',
    ariaLabel: 'Mở bài kiểm tra Face Match K-pop miễn phí',
  },
  es: {
    label: 'Anuncio',
    title: 'Face Match: SM vs. YG vs. JYP',
    subtitle: 'IA entrenada con más de 100.000 imágenes de idols',
    action: 'Test gratis',
    ariaLabel: 'Abrir el test gratuito de Face Match K-pop',
  },
  fr: {
    label: 'Pub',
    title: 'Face Match : SM vs. YG vs. JYP',
    subtitle: 'IA entraînée sur plus de 100 000 images d’idols',
    action: 'Test gratuit',
    ariaLabel: 'Ouvrir le test gratuit Face Match K-pop',
  },
  de: {
    label: 'Werbung',
    title: 'Face Match: SM vs. YG vs. JYP',
    subtitle: 'KI, trainiert mit über 100.000 Idol-Bildern',
    action: 'Kostenlos testen',
    ariaLabel: 'Kostenlosen K-Pop-Face-Match-Test öffnen',
  },
};

/** 4위 목록 위에 노출하는 Kpopface 프로모션 슬롯 */
export default function KpopfaceAdCard({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const copy = KPOPFACE_AD_COPY[locale] ?? KPOPFACE_AD_COPY.en;

  return (
    <Link
      href={KPOPFACE_URL}
      className={classNames(styles.card, { [styles.compact]: compact })}
      data-ad-slot="kpopface"
      aria-label={copy.ariaLabel}
    >
      <span className={styles.brandMark} aria-hidden="true">
        {/* next.config.mjs의 custom image loader와 충돌하지 않는 정적 로고 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/kpopface-logo.png"
          alt=""
          width={40}
          height={40}
          className={styles.brandLogo}
        />
      </span>

      <span className={styles.content}>
        <span className={styles.eyebrow}>KPOPFACE</span>
        <span className={styles.title}>{copy.title}</span>
        <span className={styles.subtitle}>{copy.subtitle}</span>
      </span>

      <span className={styles.action}>
        {copy.action}
        <ArrowRight size={14} aria-hidden="true" />
      </span>

      <span className={styles.adBadge}>
        <Megaphone size={12} aria-hidden="true" />
        {copy.label}
      </span>
    </Link>
  );
}
