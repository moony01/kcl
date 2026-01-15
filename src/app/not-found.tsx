"use client";

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from './not-found.module.scss';
import { Inter, Montserrat } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const montserrat = Montserrat({ subsets: ['latin'] });

export default function NotFound() {
  const router = useRouter();

  return (
    <html lang="en">
      <body className={`${inter.className} ${montserrat.className}`} style={{ margin: 0 }}>
        <div className={styles.notFoundContainer}>
          <div className={styles.spotlight} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={styles.content}
          >
            <h1 className={styles.glitchText}>404</h1>
            <p className={styles.message}>The Stage is Empty</p>
            <p className={styles.description}>
              이 페이지는 존재하지 않습니다.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className={styles.homeButton}
            >
              Return to Home
            </motion.button>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
