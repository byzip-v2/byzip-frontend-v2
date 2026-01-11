'use client';

import styles from '@/styles/pages/admin/admin-page-header.module.scss';
import { ReactNode } from 'react';

type AdminPageHeaderProps = {
  title: string;
  actions?: ReactNode;
};

export default function AdminPageHeader({ title, actions }: AdminPageHeaderProps) {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
