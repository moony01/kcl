"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useAnimation, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CompanyType } from '@/lib/mock-data';
import styles from './CompanySelector.module.scss';

interface CompanySelectorProps {
  companies: CompanyType[];
  onSelect: (companyId: string) => void;
  selectedCompanyId: string;
}

const DRAG_BUFFER = 50;

export default function CompanySelector({ companies, onSelect, selectedCompanyId }: CompanySelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dragX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external prop if it changes externally (initial load)
  useEffect(() => {
    const idx = companies.findIndex(c => c.id === selectedCompanyId);
    if (idx >= 0 && idx !== currentIndex) {
      setCurrentIndex(idx);
    }
  }, [selectedCompanyId, companies]);

  // Handle Index Change
  const updateIndex = (newIndex: number) => {
    // Wrap around logic
    const wrappedIndex = (newIndex + companies.length) % companies.length;
    setCurrentIndex(wrappedIndex);
    onSelect(companies[wrappedIndex].id);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -DRAG_BUFFER) {
      updateIndex(currentIndex + 1);
    } else if (info.offset.x > DRAG_BUFFER) {
      updateIndex(currentIndex - 1);
    }
  };

  // Determine which cards to render
  // We want to render a few cards around the current index to create the illusion of infinite scroll
  // Because the list is circular
  
  const getVisibleItems = () => {
    const items = [];
    const count = companies.length;
    // Render 2 items on each side
    for (let i = -2; i <= 2; i++) {
      const idx = (currentIndex + i + count) % count;
      items.push({ ...companies[idx], offset: i, key: `${companies[idx].id}-${i}` });
    }
    return items;
  };

  const visibleItems = getVisibleItems();

  return (
    <div className={styles.carouselContainer} ref={containerRef}>
      <motion.div 
        className={styles.viewport}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
      >
        {visibleItems.map((item) => {
          // Calculate styles based on offset
          const isCenter = item.offset === 0;
          const absOffset = Math.abs(item.offset);
          
          return (
            <motion.div
              key={item.key}
              className={styles.cardWrapper}
              initial={false}
              animate={{
                x: `${item.offset * 60}%`, // Percentage based overlap
                scale: isCenter ? 1.1 : 1 - (absOffset * 0.15),
                zIndex: 10 - absOffset,
                opacity: 1 - (absOffset * 0.3),
                rotateY: item.offset * -25, // Create 3D arc effect
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              style={{
                // Custom CSS variable for glow color based on company image flavor
                // Note: extracting color might be hard, so just use primary or white
                ['--glow-color' as any]: 'rgba(255, 255, 255, 0.6)' 
              }}
              onClick={() => {
                if (!isCenter) updateIndex(currentIndex + item.offset);
              }}
            >
              <div 
                className={`${styles.card} ${isCenter ? styles.active : ''}`}
              >
                <div className={styles.bgGradient} style={{ background: item.image }} />
                
                <div className={styles.cardInner}>
                  <div className={styles.rankBadge}>
                    Rank {item.rank}
                  </div>
                  
                  <div className={styles.logoArea} style={{ background: item.image }}>
                    {/* First letter as logo for now */}
                    {item.name.en.charAt(0)}
                  </div>
                  
                  <div className={styles.infoArea}>
                    <div className={styles.name}>{item.name.en}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className={styles.controls}>
        <button onClick={() => updateIndex(currentIndex - 1)} aria-label="Previous">
          <ChevronLeft size={24} />
        </button>
        <span className={styles.pagination}>
          {currentIndex + 1} <span style={{ opacity: 0.3 }}>/</span> {companies.length}
        </span>
        <button onClick={() => updateIndex(currentIndex + 1)} aria-label="Next">
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
