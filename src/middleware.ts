import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 미들웨어 실행 페이지
export const config = {
  matcher: ['/admin/:path*'],
};

const REDIRECT_PATH = '/login';

// 관리자 페이지 접근 시 토큰 유효성 검사 및 자동 갱신 처리
export async function middleware(request: NextRequest) {
  // 요청 쿠키에서 토큰 추출
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // 리프레시 토큰이 없으면 로그인 페이지로 이동
  if (!refreshToken) {
    console.warn(
      '🔐 [Middleware] 리프레시 토큰 없음 → 로그인 페이지로 리다이렉트',
    );
    return redirectToLogin(request);
  }

  // 액세스 토큰이 없더라도 리프레시 토큰이 있다면 재발급 시도
  if (!accessToken) {
    console.warn(
      '🔐 [Middleware] 액세스 토큰 없음 → 리프레시 토큰으로 재발급 시도',
    );
    const refreshed = await refreshTokens(refreshToken);
    if (refreshed) {
      return refreshed;
    }
    console.error(
      '🔐 [Middleware] 액세스 토큰 재발급 실패 → 로그인 페이지로 리다이렉트',
    );
    return redirectToLogin(request);
  }

  // 토큰 만료 여부 확인
  const { isAccessTokenValid, isRefreshTokenValid } = isValidToken({
    accesstoken: accessToken,
    refreshtoken: refreshToken,
  });

  // 리프레시 토큰이 만료된 경우 로그아웃 처리
  if (!isRefreshTokenValid) {
    console.warn(
      '🔐 [Middleware] 리프레시 토큰 만료 → 로그인 페이지로 리다이렉트',
    );
    return redirectToLogin(request);
  }

  // 액세스 토큰만 만료된 경우 재발급 시도
  if (!isAccessTokenValid) {
    console.info('🔐 [Middleware] 액세스 토큰 만료 → 재발급 시도');
    const refreshed = await refreshTokens(refreshToken);
    if (refreshed) {
      return refreshed;
    }
    // 재발급 실패 시 로그인 페이지로 이동
    console.error(
      '🔐 [Middleware] 액세스 토큰 재발급 실패 → 로그인 페이지로 리다이렉트',
    );
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

/**
 * JWT 토큰 만료 여부 검사
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
  // 현재 시간을 초 단위로 가져오기 (Unix Timestamp 형식)
  const currentTime = Math.floor(Date.now() / 1000);

  // 결과 객체를 초기화 (유효성 여부를 저장)
  const result: {
    isAccessTokenValid?: boolean;
    isRefreshTokenValid?: boolean;
  } = {};

  try {
    // 액세스 토큰이 존재하면 디코딩하여 만료 시간(`exp`) 확인
    if (accesstoken) {
      // JWT의 payload 부분(base64) 디코딩
      const accessTokenPayload = JSON.parse(atob(accesstoken.split('.')[1]));
      // 현재 시간과 만료 시간을 비교하여 유효성 판단
      result.isAccessTokenValid = accessTokenPayload.exp > currentTime;
    }

    // 리프레쉬 토큰이 존재하면 디코딩하여 만료 시간(`exp`) 확인
    if (refreshtoken) {
      // JWT의 payload 부분(base64) 디코딩
      const refreshTokenPayload = JSON.parse(atob(refreshtoken.split('.')[1]));
      // 현재 시간과 만료 시간을 비교하여 유효성 판단
      result.isRefreshTokenValid = refreshTokenPayload.exp > currentTime;
    }
  } catch (error) {
    // 디코딩 과정에서 발생한 오류를 로그로 출력
    console.error('토큰 디코딩 실패:', error);
  }

  // 유효성 결과를 반환
  return result;
}

/**
 * 리프레시 토큰으로 액세스/리프레시 토큰 재발급
 */
async function refreshTokens(
  refreshToken: string,
): Promise<NextResponse | null> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiBaseUrl) {
      console.error(
        '🔐 [Middleware] NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.',
      );
      return null;
    }

    // 백엔드 토큰 갱신 API 호출
    const refreshResponse = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      console.error(
        '🔐 [Middleware] 토큰 갱신 요청 실패:',
        refreshResponse.status,
      );
      return null;
    }

    // API 응답에서 토큰 추출
    const json = (await refreshResponse.json()) as {
      success?: boolean;
      data?: { accessToken?: string; refreshToken?: string };
    };

    if (!json.success || !json.data?.accessToken || !json.data.refreshToken) {
      console.error(
        '🔐 [Middleware] 토큰 갱신 응답 형식이 올바르지 않습니다.',
        json,
      );
      return null;
    }

    const response = NextResponse.next();

    // 재발급된 토큰을 쿠키에 저장
    setAuthCookie(response, 'accessToken', json.data.accessToken);
    setAuthCookie(response, 'refreshToken', json.data.refreshToken);

    console.log('🔐 [Middleware] 토큰 재발급 성공, 쿠키 업데이트 완료');
    return response;
  } catch (error) {
    console.error('🔐 [Middleware] 토큰 갱신 중 오류 발생:', error);
    return null;
  }
}

/**
 * 로그인 페이지로 리다이렉트
 */
function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL(REDIRECT_PATH, request.url));
}

/**
 * 인증 쿠키 설정 유틸리티
 */
function setAuthCookie(response: NextResponse, name: string, value: string) {
  // FIXME: 테스트 환경: accessToken 1분, refreshToken 10분 유지
  const maxAge = name === 'accessToken' ? 60 : 60 * 10;

  response.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}
