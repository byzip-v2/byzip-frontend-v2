'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/components/common/toast.module.scss';

interface ToastProps {
  message: string;
  color?: string;
}

const DURATION = 3000;
const EXIT_MS = 300;

export default function Toast({ message, color = 'primary' }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), DURATION - EXIT_MS);
    const removeTimer = setTimeout(() => setVisible(false), DURATION);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`${styles.toast} ${leaving ? styles.exit : styles.enter}`}
      style={{ backgroundColor: `var(--color-${color})` }}
    >
      {message}
    </div>
  );
}
