"use client";

import { ReactNode, useState, useEffect } from 'react';
import styles from './AuthLayout.module.scss';
import CompanySelector from '../../home/CompanySelector';
import { MOCK_COMPANIES } from '@/lib/mock-data';

interface AuthLayoutProps {
  children: ReactNode;
  footerLink: ReactNode;
}

export default function AuthLayout({ children, footerLink }: AuthLayoutProps) {
  const [selectedId, setSelectedId] = useState(MOCK_COMPANIES[0].id);

  // Auto-rotate effect for the visual side
  useEffect(() => {
    const interval = setInterval(() => {
      const idx = MOCK_COMPANIES.findIndex(c => c.id === selectedId);
      const nextIdx = (idx + 1) % MOCK_COMPANIES.length;
      setSelectedId(MOCK_COMPANIES[nextIdx].id);
    }, 3000); // Rotate every 3s
    return () => clearInterval(interval);
  }, [selectedId]);

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        
        {/* Left Panel: Visual (Hidden on mobile) */}
        <div className={styles.leftPanel}>
          {/* We scale it down slightly to fit or adjust styles */}
          <div style={{ transform: 'scale(0.9)', height: '100%', display: 'flex', alignItems: 'center' }}>
            <CompanySelector 
              companies={MOCK_COMPANIES}
              selectedCompanyId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </div>

        {/* Right Panel: Form */}
        <div className={styles.rightPanel}>
          <div className={styles.authBox}>
            <h1 className={styles.logo}>KCL</h1>
            {children}
          </div>
          
          <div className={styles.subBox}>
            {footerLink}
          </div>
          
          {/* App download badges or other footers can go here */}
        </div>

      </div>
    </div>
  );
}
