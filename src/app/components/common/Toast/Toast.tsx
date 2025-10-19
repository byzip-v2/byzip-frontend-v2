'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/components/common/toast.module.scss';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
}

export default function Toast({ message, type = 'success' }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      {message}
    </div>
  );
}
