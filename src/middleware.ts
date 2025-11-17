import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logErrorToDatabase } from '@/app/libs/utils/api';
import { BugReportErrorType } from 'byzip-v2-sdk';

// 미들웨어 실행 경로 설정
export const config = {
  matcher: ['/admin/:path*', '/login'],
};

/**
 * 미들웨어 메인 함수
 * 관리자 페이지 및 로그인 페이지 접근 시 토큰 유효성 검사 및 자동 갱신 처리
 *
 * 처리 흐름:
 * 1. 접근 경로 확인 (로그인 페이지 / 관리자 페이지)
 * 2. 쿠키에서 토큰 추출
 * 3. 토큰 검증 및 필요 시 재발급
 * 4. 인증 상태에 따라 접근 제어 및 리다이렉트 처리
 */
export async function middleware(request: NextRequest) {
  try {
    console.log(
      '🔐 [Middleware] 실행:',
      request.method,
      request.nextUrl.pathname,
    );
    // ========== 1단계: 경로 파악 ==========
    const { pathname } = request.nextUrl;
    const isLoginPage = pathname === '/login';
    const isAdminPage = pathname.startsWith('/admin');

    // ========== 2단계: POST 요청(Server Action) 처리 ==========
    // Server Action 요청의 경우 middleware에서 리다이렉트를 제대로 처리하지 못함
    // 따라서 POST 요청은 통과시키고, Server Action 내부에서 401 에러 시 redirect()로 처리하도록 함
    if (request.method === 'POST') {
      return NextResponse.next();
    }

    // ========== 3단계: 쿠키에서 토큰 추출 ==========
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    // ========== 4단계: 토큰 검증 및 재발급 처리 ==========
    // - isAccessAllowed: 페이지 접근 허용 여부 (리다이렉트 결정)
    // - isAuthenticated: 실제 인증 상태 (유효한 토큰 보유 여부)
    // - refreshedTokens: 재발급된 토큰
    const { isAccessAllowed, isAuthenticated, refreshedTokens } =
      await handleAuthentication({
        accessToken,
        refreshToken,
        isLoginPage,
      });

    // ========== 5단계: 인증 실패 시 처리 ==========
    if (!isAccessAllowed) {
      if (isLoginPage) {
        // 로그인 페이지는 인증 실패하면 페이지 유지
        return NextResponse.next();
      }
      // 관리자 페이지는 인증 실패 시 로그인 페이지로 리다이렉트
      console.warn('🔐 [Middleware] 인증 실패 → 로그인 페이지로 리다이렉트');
      return redirectToLogin(request);
    }

    // ========== 6단계: 로그인 페이지에서 이미 인증된 경우 처리 ==========
    // 로그인 페이지에 접근했는데 유효한 토큰이 있는 경우 관리자 페이지로 리다이렉트
    if (isLoginPage && isAuthenticated) {
      const response = redirectToAdmin(request);

      // 토큰이 재발급된 경우 쿠키에 새로 저장
      if (refreshedTokens) {
        setCookie(
          response,
          'access_token',
          refreshedTokens.accessToken,
          60, // 1분
        );
        setCookie(
          response,
          'refresh_token',
          refreshedTokens.refreshToken,
          60 * 10, // 10분
        );
      }
      return response;
    }

    // ========== 7단계: 관리자 페이지에서 토큰 재발급된 경우 처리 ==========
    // 관리자 페이지 접근 시 토큰이 재발급된 경우 쿠키에 저장하고 요청 계속 진행
    if (isAdminPage && refreshedTokens) {
      const response = NextResponse.next();
      setCookie(
        response,
        'access_token',
        refreshedTokens.accessToken,
        60 * 60 * 24, // 1일
      );
      setCookie(
        response,
        'refresh_token',
        refreshedTokens.refreshToken,
        60 * 60 * 24 * 30, // 30일
      );
      return response;
    }

    // ========== 8단계: 정상 처리 완료 ==========
    // 위 조건에 해당하지 않는 경우 요청을 그대로 진행
    return NextResponse.next();
  } catch (error) {
    // 미들웨어 실행 중 예상치 못한 에러 발생 시 로깅
    await logErrorToDatabase(error, {
      actionName: 'middleware',
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch((logError) => {
      console.error('🔐 [Middleware] 에러 로깅 실패:', logError);
    });

    // 에러 발생 시에도 기본 동작 수행 (로그인 페이지로 리다이렉트)
    console.error('🔐 [Middleware] 미들웨어 실행 중 오류 발생:', error);
    return redirectToLogin(request);
  }
}

// 토큰 데이터 타입
type TokenData = {
  accessToken: string; // 액세스 토큰 (짧은 만료 시간)
  refreshToken: string; // 리프레시 토큰 (긴 만료 시간)
};

/**
 * 인증 처리 결과 타입
 * @property isAccessAllowed - 페이지 접근 허용 여부 (리다이렉트 결정)
 * @property isAuthenticated - 실제 인증 상태 (유효한 토큰 보유 여부)
 * @property refreshedTokens - 재발급된 토큰 (있는 경우)
 */
type AuthResult = {
  isAccessAllowed: boolean;
  isAuthenticated: boolean;
  refreshedTokens?: TokenData;
};

/**
 * 토큰 검증 및 재발급
 * @param accessToken - 액세스 토큰 (선택적)
 * @param refreshToken - 리프레시 토큰 (선택적)
 * @param isLoginPage - 로그인 페이지 여부
 * @returns 인증 처리 결과 (AuthResult)
 */
async function handleAuthentication({
  accessToken,
  refreshToken,
  isLoginPage,
}: {
  accessToken?: string;
  refreshToken?: string;
  isLoginPage: boolean;
}): Promise<AuthResult> {
  try {
    // ========== 1단계: 리프레시 토큰 존재 여부 확인 ==========
    if (!refreshToken) {
      return { isAccessAllowed: false, isAuthenticated: false };
    }

    // ========== 2단계: 리프레시 토큰 유효성 검사 ==========
    const { isRefreshTokenValid } = isValidToken({
      refreshtoken: refreshToken,
    });
    if (!isRefreshTokenValid) {
      // 리프레시 토큰이 만료된 경우 인증 불가
      return { isAccessAllowed: false, isAuthenticated: false };
    }

    // ========== 3단계: 액세스 토큰 유효성 검사 및 재발급 ==========
    const { isAccessTokenValid } = isValidToken({ accesstoken: accessToken });
    if (!accessToken || !isAccessTokenValid) {
      // 액세스 토큰이 없거나 만료된 경우 재발급 시도
      const tokenData = await refreshTokens(refreshToken);
      if (tokenData) {
        // 재발급 성공: 접근 허용, 인증됨, 새 토큰 반환
        return {
          isAccessAllowed: true,
          isAuthenticated: true,
          refreshedTokens: tokenData,
        };
      }
      // 재발급 실패 시:
      return { isAccessAllowed: isLoginPage, isAuthenticated: false };
    }

    // 액세스 토큰이 유효하면 재발급 없이 접근 허용
    return { isAccessAllowed: true, isAuthenticated: true };
  } catch (error) {
    // 인증 처리 중 예상치 못한 에러 발생 시 로깅
    await logErrorToDatabase(error, {
      actionName: 'handleAuthentication - 인증 처리 실패',
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});
    // 에러 발생 시 인증 실패로 처리
    return { isAccessAllowed: isLoginPage, isAuthenticated: false };
  }
}

/**
 * JWT 토큰 만료 여부 검사 함수
 * JWT 토큰의 payload를 디코딩하여 exp(만료 시간)와 현재 시간을 비교
 *
 * @param accesstoken - 액세스 토큰 (선택적)
 * @param refreshtoken - 리프레시 토큰 (선택적)
 * @returns 토큰 유효성 검사 결과
 */
function isValidToken({
  accesstoken,
  refreshtoken,
}: {
  accesstoken?: string;
  refreshtoken?: string;
}): {
  isAccessTokenValid?: boolean;
  isRefreshTokenValid?: boolean;
} {
  // 현재 시간을 Unix timestamp(초 단위)로 변환
  const currentTime = Math.floor(Date.now() / 1000);
  const result: {
    isAccessTokenValid?: boolean;
    isRefreshTokenValid?: boolean;
  } = {};

  try {
    // 액세스 토큰 유효성 검사
    if (accesstoken) {
      // JWT 구조: header.payload.signature
      // payload 부분(index 1)을 Base64 디코딩
      const payload = JSON.parse(atob(accesstoken.split('.')[1]));
      // exp(만료 시간)가 현재 시간보다 큰지 확인
      result.isAccessTokenValid = payload.exp > currentTime;
    }

    // 리프레시 토큰 유효성 검사
    if (refreshtoken) {
      // JWT 구조: header.payload.signature
      // payload 부분(index 1)을 Base64 디코딩
      const payload = JSON.parse(atob(refreshtoken.split('.')[1]));
      // exp(만료 시간)가 현재 시간보다 큰지 확인
      result.isRefreshTokenValid = payload.exp > currentTime;
    }
  } catch (error) {
    // 토큰 디코딩 실패 시 (형식 오류, 만료된 토큰 등)
    console.error('🔐 [Middleware] 토큰 디코딩 실패:', error);
    logErrorToDatabase(error, {
      actionName: 'isValidToken - 토큰 디코딩 실패',
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});
  }

  return result;
}

/**
 * 리프레시 토큰으로 액세스 토큰, 리프레시 토큰 재발급 함수
 * 서버 API에 리프레시 토큰을 전송하여 새로운 액세스 토큰과 리프레시 토큰을 받아옴
 *
 * @param refreshToken - 리프레시 토큰
 * @returns 새로 발급받은 토큰 데이터 (실패 시 null)
 */
async function refreshTokens(refreshToken: string): Promise<TokenData | null> {
  try {
    // ========== 1단계: API Base URL 확인 ==========
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      const error = new Error('NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.');
      console.error('🔐 [Middleware]', error.message);
      await logErrorToDatabase(error, {
        actionName: 'refreshTokens - API URL 미설정',
        errorType: BugReportErrorType.SERVER_ERROR,
      }).catch(() => {});
      return null;
    }

    // ========== 2단계: 토큰 재발급 API 요청 ==========
    const refreshResponse = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    // ========== 3단계: 응답 상태 확인 ==========
    if (!refreshResponse.ok) {
      const error = new Error(`토큰 갱신 요청 실패: ${refreshResponse.status}`);
      console.error('🔐 [Middleware]', error.message);
      await logErrorToDatabase(error, {
        actionName: `refreshTokens - HTTP ${refreshResponse.status}`,
        errorType: BugReportErrorType.SERVER_ERROR,
      }).catch(() => {});
      return null;
    }

    // ========== 4단계: 응답 데이터 파싱 ==========
    const json = (await refreshResponse.json()) as {
      success?: boolean;
      data?: { accessToken?: string; refreshToken?: string };
    };

    // ========== 5단계: 응답 데이터 검증 ==========
    if (!json.success || !json.data?.accessToken || !json.data.refreshToken) {
      const error = new Error('토큰 갱신 응답 형식이 올바르지 않습니다.');
      console.error('🔐 [Middleware]', error.message);
      await logErrorToDatabase(error, {
        actionName: 'refreshTokens - 응답 형식 오류',
        errorType: BugReportErrorType.SERVER_ERROR,
      }).catch(() => {});
      return null;
    }

    // ========== 6단계: 토큰 반환 ==========
    console.log('🔐 [Middleware] 토큰 재발급 성공');
    return {
      accessToken: json.data.accessToken,
      refreshToken: json.data.refreshToken,
    };
  } catch (error) {
    // 네트워크 오류 등 예외 상황 처리
    console.error('🔐 [Middleware]', error);
    await logErrorToDatabase(error, {
      actionName: 'refreshTokens - 예외 발생',
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});
    return null;
  }
}

/**
 * 쿠키 설정 헬퍼 함수
 *
 * @param response - NextResponse 객체
 * @param name - 쿠키 이름
 * @param value - 쿠키 값
 * @param maxAge - 쿠키 만료 시간 (초 단위)
 */
function setCookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number,
) {
  response.cookies.set(name, value, {
    httpOnly: true, // JavaScript에서 접근 불가 (XSS 공격 방지)
    secure: process.env.NODE_ENV === 'production', // 프로덕션에서만 HTTPS 사용
    sameSite: 'lax', // CSRF 공격 방지
    path: '/', // 모든 경로에서 쿠키 사용 가능
    maxAge, // 쿠키 만료 시간 (초 단위)
  });
}

/**
 * 로그인 페이지로 리다이렉트 함수
 *
 * @param request - NextRequest 객체
 * @returns 로그인 페이지로 리다이렉트하는 NextResponse
 */
function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL('/login', request.url));
}

/**
 * 관리자 페이지로 리다이렉트 함수
 *
 * @param request - NextRequest 객체
 * @returns 관리자 페이지로 리다이렉트하는 NextResponse
 */
function redirectToAdmin(request: NextRequest) {
  return NextResponse.redirect(new URL('/admin', request.url));
}
