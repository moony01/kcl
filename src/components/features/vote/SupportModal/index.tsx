"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Flame } from 'lucide-react';
import Modal from '@/components/common/Modal';
import styles from './SupportModal.module.scss';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  companyId: string;
  companyImage: string; // Gradient or Image URL
}

export default function SupportModal({ isOpen, onClose, companyName, companyId, companyImage }: SupportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset state when modal opens
  if (isOpen && isSuccess && !isLoading) {
    // If it was already successful and reopened, we might want to reset? 
    // Usually user opens to vote again.
    // For now handled in onClose
  }

  const handleSupport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      });

      if (res.ok) {
        setIsSuccess(true);
        // Dispatch custom event to notify other components (e.g. Ranking Item) to update score optimistically
        // Or just let SWR/React Query revalidate if we were using it.
        // For this demo, we can use a window event or context. 
        // Let's use a simple window event for loose coupling in this mock setup.
        window.dispatchEvent(new CustomEvent('vote-update', { detail: { companyId, scoreDelta: 100 } }));
        
        // Auto close after success? Or let user admire?
        // Let's auto-close after 1.5s
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        alert('Failed to support. Please try again.');
      }
    } catch (e) {
      console.error(e);
      alert('Error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isSuccess ? undefined : "Support Confirmation"}>
      {isSuccess ? (
        <div className={styles.successContent}>
          <motion.div 
            className={styles.glowCircle}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            <Check size={40} color="#fff" strokeWidth={4} />
          </motion.div>
          <h3>Support Complete!</h3>
          <p>You added +100 Firepower to <strong>{companyName}</strong>!</p>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.targetInfo}>
            <div className={styles.avatar} style={{ background: companyImage }}>
              {companyName.charAt(0)}
            </div>
            <p className={styles.message}>
              Do you want to send firepower to<br />
              <strong>{companyName}</strong>?
            </p>
          </div>
          
          <div className={styles.actions}>
            <button className={styles.cancel} onClick={handleClose} disabled={isLoading}>
              Cancel
            </button>
            <button className={styles.confirm} onClick={handleSupport} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Confirm Support'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
