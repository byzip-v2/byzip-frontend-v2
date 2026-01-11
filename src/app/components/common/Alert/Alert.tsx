'use client';

import styles from '@/styles/components/alert.module.scss';
import { ReactNode } from 'react';

type AlertProps = {
  open: boolean;
  text: ReactNode;
  confirmText?: string;
  onConfirm: () => void;
};

export default function Alert({
  open,
  text,
  confirmText = '확인',
  onConfirm,
}: AlertProps) {
  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation">
      <div
        className={styles.alert}
        role="alertdialog"
        aria-modal="true"
        aria-label="알림"
      >
        <div className={styles.text}>{text}</div>
        <div className={styles.actions}>
          <button type="button" className={styles.confirm} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
