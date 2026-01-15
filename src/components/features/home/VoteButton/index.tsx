"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Fingerprint } from 'lucide-react';
import { CompanyType } from '@/lib/mock-data';
import { useVote } from '@/hooks/useVote';
import styles from './VoteButton.module.scss';
import classNames from 'classnames';

interface VoteButtonProps {
  company: CompanyType;
}

export default function VoteButton({ company }: VoteButtonProps) {
  const { submitVote, isLoading } = useVote();
  const [showPopup, setShowPopup] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleClick = async () => {
    if (isLoading) return; // Prevent spam if needed, or allow spam for game feel
    
    // Optimistic Popup
    const popupId = Date.now();
    setShowPopup(true);
    setClickCount(prev => prev + 1);

    // Call API
    await submitVote(company.id, company.image); // Pass gradient/color for confetti
    
    // Hide popup after animation
    setTimeout(() => {
      setShowPopup(false);
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <motion.button 
        className={styles.voteBtn}
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
      >
        <div 
          className={styles.logoWrapper} 
          style={{ background: company.image }}
        >
          {/* Logo Placeholder */}
          {company.name.en.charAt(0)}
        </div>
        
        {/* Score Popup Effect */}
        <AnimatePresence>
          {showPopup && (
            <motion.div
              key={clickCount} // Unique key for every click to restart animation
              className={styles.scorePopup}
              initial={{ opacity: 1, y: 0, scale: 0.5 }}
              animate={{ opacity: 0, y: -80, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              +100
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <div className={styles.label}>
        <span>Tap to Support</span>
        <Fingerprint size={20} />
      </div>
    </div>
  );
}
