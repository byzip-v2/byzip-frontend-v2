import { BetaAnalyticsDataClient } from "@google-analytics/data";

const { GOOGLE_SERVICE_ACCOUNT, GOOGLE_ANALYTICS_PROPERTY_ID } = process.env;

const client = new BetaAnalyticsDataClient({
  credentials: JSON.parse(GOOGLE_SERVICE_ACCOUNT || ""),
});

export async function GET() {
  try {
    // Google Analytics Data API 호출
    const [response] = await client.runReport({
      property: `properties/${GOOGLE_ANALYTICS_PROPERTY_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }], // 지난 30일간의 데이터 조회
      metrics: [{ name: "activeUsers" }], // 활성 사용자
      dimensions: [{ name: "date" }], // 날짜별로
      keepEmptyRows: true, // 빈 행(Row) 조회
    });

    // 원하는 형식의 데이터로 가공
    const result =
      response.rows?.reduce((acc, row) => {
        const date = row.dimensionValues?.[0]?.value;
        const activeUsers = Number(row.metricValues?.[0]?.value || 0);
        acc[date] = { activeUsers };
        return acc;
      }, {}) || {};

    return Response.json(result);
  } catch (error) {
    console.error("Analytics API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch analytics" }),
      {
        status: 500,
      }
    );
  }
}
