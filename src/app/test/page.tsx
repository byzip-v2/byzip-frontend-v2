interface AnalyticsData {
  [date: string]: {
    activeUsers: number;
  };
}

export default async function Page() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics`);
  const data: AnalyticsData = await res.json();

  return (
    <div>
      <h1>📈한 달간 활성 사용자</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
