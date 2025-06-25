import { BetaAnalyticsDataClient } from "@google-analytics/data";

const { GOOGLE_SERVICE_ACCOUNT, GOOGLE_ANALYTICS_PROPERTY_ID } = process.env;

const client = new BetaAnalyticsDataClient({
  credentials: JSON.parse(GOOGLE_SERVICE_ACCOUNT || ""),
});

// 한 달간 방문자 수 일자별 조회
export async function getDailyVisitors() {
  // Google Analytics Data API 호출
  const [response] = await client.runReport({
    property: `properties/${GOOGLE_ANALYTICS_PROPERTY_ID}`,
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }], // 지난 30일간의 데이터 조회
    metrics: [{ name: "activeUsers" }], // 활성 사용자
    dimensions: [{ name: "date" }], // 날짜별로
  });

  // 데이터 가공
  const result =
    response.rows?.map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? "",
      activeUsers: Number(row.metricValues?.[0]?.value ?? 0),
    })) ?? [];

  return result;
}

// 한 달간 운영체제별 방문자 수 조회
export async function getOSVisitors() {
  const [response] = await client.runReport({
    property: `properties/${GOOGLE_ANALYTICS_PROPERTY_ID}`,
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "operatingSystem" }],
    metrics: [{ name: "activeUsers" }],
  });

  const result =
    response.rows?.map((row) => ({
      os: row.dimensionValues?.[0]?.value ?? "",
      activeUsers: Number(row.metricValues?.[0]?.value ?? 0),
    })) ?? [];

  return result;
}

// 한 달간 조회수 상위 페이지 조회
export async function getTopPages() {
  const [response] = await client.runReport({
    property: `properties/${GOOGLE_ANALYTICS_PROPERTY_ID}`,
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "pageTitle" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 10,
  });

  const result =
    response.rows?.map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "",
      pageViews: Number(row.metricValues?.[0]?.value ?? 0),
    })) ?? [];

  return result;
}
