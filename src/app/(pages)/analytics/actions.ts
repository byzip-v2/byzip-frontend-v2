'use server';

/**
 * 분석 페이지 Server Actions
 */

import { serverApiWithoutToken } from '@/app/libs/utils/api';
import type { ActionResult } from '@/app/libs/types/api';

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

export interface AnalyticsData {
  dailyVisitors: DailyVisitor[];
  osVisitors: OSVisitor[];
  topPages: TopPage[];
}

/**
 * 분석 데이터 조회 Server Action
 */
export async function getAnalyticsData(): Promise<ActionResult<AnalyticsData>> {
  try {
    // API 요청 (serverApi가 자동으로 토큰 추가)
    const response = await serverApiWithoutToken.get<AnalyticsData>(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics`,
    );

    // 응답 구조 검증
    if (response.status !== 200 || !response.data) {
      return {
        success: false,
        message: '분석 데이터를 가져올 수 없습니다.',
      };
    }

    const data = response.data;

    return {
      success: true,
      message: '분석 데이터를 성공적으로 가져왔습니다.',
      data: data,
    };
  } catch (error) {
    console.error('getAnalyticsData error:', error);
    return {
      success: false,
      message: '분석 데이터 조회 중 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}
