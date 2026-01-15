"use client";

import { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './MobileLayout.module.scss';
import BottomNav from '../BottomNav'; // Will be created next

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className={styles.container}>
      <main className={styles.mainContent}>
        <AnimatePresence mode="wait">
           {/* 페이지 전환 애니메이션을 위한 키핑은 page 레벨에서 처리하거나 여기서 pathname을 key로 줄 수 있음. 
               일단은 children 렌더링에 집중 */}
          {children}
        </AnimatePresence>
      </main>
      
      {/* Legal Footer */}
      <footer className={styles.legalFooter}>
        <p>This is an Unofficial Fan App. Not affiliated with any entertainment company.</p>
      </footer>

      {/* Bottom Navigation is fixed, checking if we need to implement it here or layout */}
      <BottomNav />
    </div>
  );
}
