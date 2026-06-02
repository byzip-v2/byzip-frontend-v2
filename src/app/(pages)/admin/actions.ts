'use server';

/**
 * 관리자 페이지 Server Actions
 * 서버 사이드에서 안전하게 사용자 정보를 조회합니다.
 */

import axios from 'axios';
import {
  ApiResponse,
  BugReportErrorType,
  BugReportResponseDto,
  HousingSupplyResponseDto,
  MemberResponseDto,
} from 'byzip-v2-sdk';
import {
  serverApiWithToken,
  serverApiWithoutToken,
  logErrorToDatabase,
} from '@/app/libs/utils/api';
import type { ActionResult } from '@/app/libs/types/api';
import { handleNextRedirectError } from '@/app/libs/utils/server-actions';
import { getDailyVisitors, getOSVisitors } from '@/app/libs/utils/analytics';

/**
 * 사용자 정보 조회 Server Action
 *
 * @description
 * 1. 현재 사용자의 accessToken을 쿠키에서 가져옴
 * 2. Authorization 헤더에 토큰을 포함하여 /users/me API 호출
 * 3. 사용자 정보를 반환
 *
 * @returns 사용자 정보 조회 결과
 */
export async function getUserInfo(): Promise<ActionResult<MemberResponseDto>> {
  try {
    // API 요청 (토큰 자동 포함)
    const response = await serverApiWithToken.get('/users/me');

    // SDK 응답 구조 검증
    if (response.status != 200 || !response.data) {
      return {
        success: false,
        message: '사용자 정보를 가져올 수 없습니다.',
      };
    }

    const userInfo = response.data;

    return {
      success: true,
      message: '사용자 정보를 성공적으로 가져왔습니다.',
      data: userInfo.data,
    };
  } catch (error) {
    // NEXT_REDIRECT 에러는 Next.js가 처리하도록 위임
    handleNextRedirectError(error);

    console.error('🔍 [getUserInfo] 에러 발생:', error);
    logErrorToDatabase(error, {
      actionName: 'getUserInfo',
      skipAxiosError: true,
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});

    if (axios.isAxiosError(error)) {
      // HTTP 에러 응답
      if (error.response) {
        let errorMessage = '사용자 정보를 가져오는데 실패했습니다.';

        // 에러 응답 데이터 확인
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }

        return {
          success: false,
          message: errorMessage,
        };
      }
      // 네트워크 에러
      else if (error.request) {
        return {
          success: false,
          message: '네트워크 연결을 확인해주세요.',
        };
      }
    }

    // 기타 모든 에러
    return {
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}

/**
 * 에러 발생 테스트용 Server Action
 *
 * @param errorType - 발생시킬 에러 타입 ('404' | '500' | 'network' | 'timeout')
 * @returns 테스트 결과
 *
 * @description
 * 버그 리포트 기능을 테스트하기 위한 에러 발생 함수입니다.
 */
export async function triggerTestError(
  errorType: '404' | '500' | 'network' | 'timeout',
): Promise<ActionResult> {
  try {
    switch (errorType) {
      case '404':
        // 404 에러 발생 (존재하지 않는 엔드포인트)
        await serverApiWithToken.get('/test/not-found-endpoint');
        break;
      case '500':
        // 500 에러 발생 (서버 에러 시뮬레이션)
        await serverApiWithToken.get('/test/server-error');
        break;
      case 'network':
        // 네트워크 에러 발생 (잘못된 URL)
        // serverApiWithoutToken을 사용하여 응답 인터셉터가 실행되도록 함
        await serverApiWithoutToken.get(
          'https://invalid-url-that-does-not-exist-12345.com/api/test',
          {
            timeout: 5000,
          },
        );
        break;
      case 'timeout':
        // 타임아웃 에러 발생
        // serverApiWithToken을 사용하여 응답 인터셉터가 실행되도록 함
        await serverApiWithToken.get('/test/timeout', {
          timeout: 1, // 1ms 타임아웃으로 강제 타임아웃 발생
        });
        break;
    }

    return {
      success: true,
      message: '에러가 발생하지 않았습니다.',
    };
  } catch (error) {
    logErrorToDatabase(error, {
      actionName: 'triggerTestError',
      skipAxiosError: true,
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});

    // 에러가 정상적으로 발생한 경우
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: `테스트 에러 발생: ${errorType} (${error.response?.status || 'Network Error'})`,
      };
    }

    return {
      success: false,
      message: `테스트 에러 발생: ${errorType}`,
    };
  }
}

/**
 * getUserInfo 에러 테스트용 Server Action
 *
 * @description
 * getUserInfo() 함수에서 에러를 발생시켜 버그 리포트 기능을 테스트합니다.
 * 실제 /users/me API를 호출하지만, 존재하지 않는 엔드포인트를 호출하여 404 에러를 발생시킵니다.
 */
export async function testGetUserInfoError(): Promise<ActionResult> {
  try {
    // 존재하지 않는 엔드포인트를 호출하여 404 에러 발생
    // 이렇게 하면 getUserInfo()와 동일한 방식으로 에러가 발생하고 버그 리포트가 저장됩니다
    await serverApiWithToken.get('/users/me-invalid-endpoint-for-test');

    return {
      success: true,
      message: '에러가 발생하지 않았습니다.',
    };
  } catch (error) {
    // NEXT_REDIRECT 에러는 Next.js가 처리하도록 위임
    handleNextRedirectError(error);

    logErrorToDatabase(error, {
      actionName: 'testGetUserInfoError',
      skipAxiosError: true,
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});

    // 에러가 정상적으로 발생한 경우
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: `getUserInfo 테스트 에러 발생: ${error.response?.status || 'Network Error'}`,
      };
    }

    return {
      success: false,
      message: 'getUserInfo 테스트 에러 발생',
    };
  }
}

export async function getDashboardSummary(): Promise<
  ActionResult<{ pendingCount: number; todayNewCount: number }>
> {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. 오늘 올라온 공고 (공고일 rcritPblancDe가 오늘인 것)
    const todayRes = await serverApiWithToken.get<
      ApiResponse<HousingSupplyResponseDto[]>
    >('/housing-supplies', {
      params: {
        rcritPblancDeFrom: todayStr,
        rcritPblancDeTo: todayStr,
        limit: 1,
      },
    });

    // 2. 모집중인 공고
    const recruitingRes = await serverApiWithToken.get('/housing-supplies', {
      params: {
        recruiting: true,
        limit: 1,
      },
    });

    return {
      success: true,
      message: '성공적으로 통계를 가져왔습니다.',
      data: {
        pendingCount: recruitingRes.data.meta.total,
        todayNewCount: todayRes.data.meta.total,
      },
    };
  } catch (error) {
    handleNextRedirectError(error);
    console.error('🔍 [getDashboardSummary] 에러 발생:', error);

    return {
      success: false,
      message: '통계 정보를 가져오는데 실패했습니다.',
      data: { pendingCount: 0, todayNewCount: 0 },
    };
  }
}

/**
 * 대시보드 분석 통계(방문자 수, OS 비율)를 가져옵니다.
 */
export async function getAnalyticsSummary(): Promise<
  ActionResult<{
    dailyVisitors: { date: string; activeUsers: number }[];
    osVisitors: { os: string; activeUsers: number }[];
  }>
> {
  try {
    const [daily, os] = await Promise.all([
      getDailyVisitors(),
      getOSVisitors(),
    ]);

    return {
      success: true,
      message: '분석 통계를 성공적으로 가져왔습니다.',
      data: {
        dailyVisitors: daily,
        osVisitors: os,
      },
    };
  } catch (error) {
    console.error('🔍 [getAnalyticsSummary] 에러 발생:', error);
    return {
      success: false,
      message: '분석 통계를 가져오는데 실패했습니다.',
      data: {
        dailyVisitors: [],
        osVisitors: [],
      },
    };
  }
}

/**
 * 좌표가 없는 공고 목록(최대 10개) 및 전체 개수를 가져옵니다.
 */
export async function getMissingCoordinatesSummary(): Promise<
  ActionResult<{ items: HousingSupplyResponseDto[]; total: number }>
> {
  try {
    const response = await serverApiWithToken.get(
      '/housing-supplies/missing-coordinates',
      {
        params: {
          limit: 10,
          page: 1,
          sortBy: 'rcritPblancDe',
          sortOrder: 'DESC',
        },
      },
    );

    return {
      success: true,
      message: '좌표 없는 공고를 성공적으로 가져왔습니다.',
      data: {
        items: response.data.data,
        total: response.data.meta.total,
      },
    };
  } catch (error) {
    console.error('🔍 [getMissingCoordinatesSummary] 에러 발생:', error);
    return {
      success: false,
      message: '좌표 없는 공고를 가져오는데 실패했습니다.',
      data: { items: [], total: 0 },
    };
  }
}

/**
 * 최신 버그 리포트 목록(최대 10개)을 가져옵니다.
 */
export async function getBugReportsSummary(): Promise<
  ActionResult<BugReportResponseDto[]>
> {
  try {
    const response = await serverApiWithToken.get('/bug-reports', {
      params: {
        limit: 10,
        page: 1,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      },
    });

    return {
      success: true,
      message: '버그 리포트를 성공적으로 가져왔습니다.',
      data: response.data.data,
    };
  } catch (error) {
    console.error('🔍 [getBugReportsSummary] 에러 발생:', error);
    return {
      success: false,
      message: '버그 리포트를 가져오는데 실패했습니다.',
      data: [],
    };
  }
}
