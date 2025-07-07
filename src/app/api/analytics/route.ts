import {
  getDailyVisitors,
  getOSVisitors,
  getTopPages,
} from "../../libs/utils/analytics";

export async function GET() {
  try {
    const [daily, os, pages] = await Promise.all([
      getDailyVisitors(),
      getOSVisitors(),
      getTopPages(),
    ]);

    return Response.json({
      dailyVisitors: daily,
      osVisitors: os,
      topPages: pages,
    });
  } catch (err) {
    console.error("Analytics summary error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to load analytics summary" }),
      {
        status: 500,
      }
    );
  }
}
