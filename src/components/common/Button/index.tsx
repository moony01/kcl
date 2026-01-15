"use client";

import { ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import classNames from 'classnames';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  className,
  variant = 'solid',
  size = 'md',
  isLoading = false,
  icon,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      className={classNames(
        styles.button,
        styles[variant],
        styles[size],
        className
      )}
      whileTap={{ scale: 0.95 }}
      disabled={isLoading || props.disabled}
      {...(props as HTMLMotionProps<"button">)}
    >
      {isLoading ? (
        <Loader2 className={styles.spinner} size={18} />
      ) : (
        <>
          {icon && <span className={styles.icon}>{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
}
