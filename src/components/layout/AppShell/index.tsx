/**
 * AppShell
 * 
 * 전역 레이아웃 셸 컴포넌트
 * 인스타그램 스타일의 레이아웃 구조를 제공합니다.
 * 
 * 구조:
 * - Desktop(768px+): 사이드바 + 메인 콘텐츠
 * - Mobile(<768px): 헤더 + 메인 콘텐츠 + 하단 네비게이션
 * 
 * @param children - 페이지별 콘텐츠
 */

"use client";

import { ReactNode } from 'react';
import styles from './AppShell.module.scss';
import Sidebar from '../Sidebar';
import BottomNav from '../BottomNav';
import Header from '../Header';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.appContainer}>
      {/* Desktop Sidebar - 768px 이상에서 표시 */}
      <div className={styles.sidebarWrapper}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Header - 모바일에서 상단 고정, 데스크탑에서 플로팅 언어 선택기 */}
        <Header />
        
        {/* Page Content */}
        <div className={styles.contentInner}>
          {children}
        </div>

        {/* Legal Footer */}
        <footer className={styles.legalFooter}>
          <p>© 2026 KCL. Unofficial Fan App.</p>
        </footer>
      </main>

      {/* Mobile Bottom Nav - 768px 미만에서 표시 */}
      <div className={styles.bottomNavWrapper}>
        <BottomNav />
      </div>
    </div>
  );
}
