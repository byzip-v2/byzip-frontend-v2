'use client';

import AdminPageHeader from '@/app/pub/admin/AdminPageHeader';
import styles from '@/styles/pages/admin/dashboard.module.scss';

export default function AdminDashboardPage() {
  return (
    <div>
      <AdminPageHeader title="대시보드" />
      <section className={styles.section}>
        {/* 여기 콘텐츠 */}
        <p>대시보드 위젯이나 지표를 배치하세요.</p>
      </section>
    </div>
  );
}
