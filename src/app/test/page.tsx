import styles from "@/app/styles/Analytics.module.scss";

interface DailyVisitor {
  date: string; // 예: "2025-06-23"
  activeUsers: number;
}

interface OSVisitor {
  os: string; // 예: "iOS", "Windows"
  activeUsers: number;
}

interface TopPage {
  path: string; // 예: "/home", "/detail/abc"
  pageViews: number;
}

interface AnalyticsData {
  dailyVisitors: DailyVisitor[];
  osVisitors: OSVisitor[];
  topPages: TopPage[];
}

export default async function Page() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics`);
  const data: AnalyticsData = await res.json();

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
