"use client";

import { useTranslations } from 'next-intl';
import styles from './page.module.scss'; // Reusing page styles for consistency

export default function SupportPage() {
  const t = useTranslations('Nav');

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh', 
      flexDirection: 'column', 
      textAlign: 'center' 
    }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Support</h2>
      <p style={{ color: 'var(--color-text-dim)' }}>Coming Soon...</p>
    </div>
  );
}
