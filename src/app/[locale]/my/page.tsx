"use client";

import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import styles from './page.module.scss';

export default function MyPage() {
  const t = useTranslations('Nav');

  return (
    <div className={styles.homeContainer}>
      <Header />
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh', 
        flexDirection: 'column', 
        textAlign: 'center' 
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>My Page</h2>
        <p style={{ color: 'var(--color-text-dim)' }}>Coming Soon...</p>
      </div>
    </div>
  );
}
