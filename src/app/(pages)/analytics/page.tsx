import styles from '@/styles/pages/analytics/Analytics.module.scss';
import { getAnalyticsData } from './actions';

export default async function Page() {
  const result = await getAnalyticsData();

  if (!result.success || !result.data) {
    return (
      <div className={styles.summaryWrapper}>
        <div className={styles.summaryGrid}>
          <section className={styles.summarySection}>
            <h2>❌ 오류</h2>
            <p>{result.message}</p>
          </section>
        </div>
      </div>
    );
  }

  const data = result.data;

  return (
    <div className={styles.summaryWrapper}>
      <div className={styles.summaryGrid}>
        <section className={styles.summarySection}>
          <h2>📅 일자별 활성 사용자</h2>
          <pre>{JSON.stringify(data.dailyVisitors, null, 2)}</pre>
        </section>

        <section className={styles.summarySection}>
          <h2>💻 운영체제별 활성 사용자</h2>
          <pre>{JSON.stringify(data.osVisitors, null, 2)}</pre>
        </section>

        <section className={styles.summarySection}>
          <h2>📄 조회수 상위 페이지</h2>
          <pre>{JSON.stringify(data.topPages, null, 2)}</pre>
        </section>
      </div>
    </div>
  );
}
