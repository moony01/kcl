"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Tabs.module.scss';
import classNames from 'classnames';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
}

export default function Tabs({ items, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0].id);

  return (
    <div className={styles.tabsContainer}>
      {/* Tab Header (Buttons) */}
      <div className={styles.tabHeader}>
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={classNames(styles.tabBtn, { [styles.active]: isActive })}
            >
              {item.label}
              {isActive && (
                <motion.div
                  className={styles.indicator}
                  layoutId="activeTabIndicator"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content (Panels) */}
      <div className={styles.tabContent}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {items.find((item) => item.id === activeTab)?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
