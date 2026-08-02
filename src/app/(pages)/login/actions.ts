'use server';

/**
 * 로그인 Server Actions
 * 서버 사이드에서 안전하게 인증 처리를 수행합니다.
 */

import { cookies } from 'next/headers';
import axios from 'axios';
import {
  BugReportErrorType,
  TokenResponseDto,
  type BaseResponseDto,
  type LoginRequestDto,
} from 'byzip-v2-sdk';
import {
  serverApiWithToken,
  serverApiWithoutToken,
  logErrorToDatabase,
} from '@/app/libs/utils/api';
import { ActionResult } from 'next/dist/server/app-render/types';
import {
  accessTokenMaxAge,
  refreshTokenMaxAge,
} from '@/app/libs/utils/constants';

/**
 * 로그인 Server Action
 *
 * @param userId - 사용자 아이디
 * @param password - 사용자 비밀번호
 * @returns 로그인 성공 여부와 토큰 정보
 *
 * @description
 * 1. POST /auth/login으로 userId와 password 전송
 * 2. 성공 시 Access Token과 Refresh Token 발급 (365일 만료)
 * 3. 토큰을 httpOnly 쿠키에 안전하게 저장
 *
 */
export async function loginAction(
  userId: string,
  password: string,
): Promise<ActionResult> {
  try {
    const requestBody: LoginRequestDto = {
      username: userId.trim(),
      password: password,
    };

    // API 요청 (serverApi 사용)
    const response = await serverApiWithoutToken.post<
      BaseResponseDto<TokenResponseDto>
    >('/auth/login', requestBody);

    // 응답 성공 시 응답 데이터 확인
    const responseData = response.data;

    // SDK 응답 구조 검증
    if (!responseData.success || !responseData.data) {
      return {
        success: false,
        message: responseData.message || '응답 형식이 올바르지 않습니다.',
      };
    }

    const tokenData = responseData.data;

    // 토큰 유효성 검증
    if (!tokenData.accessToken || !tokenData.refreshToken) {
      return {
        success: false,
        message: '토큰 정보가 올바르지 않습니다.',
      };
    }

    // 토큰을 httpOnly 쿠키에 저장
    // httpOnly: XSS 공격 방지
    // secure: HTTPS에서만 전송 (프로덕션)
    // sameSite: CSRF 공격 방지
    // maxAge: 365일 (31536000초)
    const cookieStore = await cookies();

    // 1. Access Token 저장 (보안 옵션: httpOnly, secure, sameSite)
    cookieStore.set('access_token', tokenData.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTokenMaxAge,
      path: '/',
    });

    // 2. Refresh Token 저장 (만료일 30일 설정)
    cookieStore.set('refresh_token', tokenData.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshTokenMaxAge,
      path: '/',
    });

    // 3. Grant Type 저장 (API Authorization 헤더 구성 시 동적으로 사용하기 위함)
    cookieStore.set('grant_type', tokenData.grantType, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTokenMaxAge,
      path: '/',
    });

    return {
      success: true,
      message: responseData.message || '로그인에 성공했습니다.',
    };
  } catch (error) {
    logErrorToDatabase(error, {
      actionName: 'loginAction',
      skipAxiosError: true,
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});

    // axios 에러 처리
    console.error('Login error:', error);

    if (axios.isAxiosError(error)) {
      // HTTP 에러 응답
      if (error.response) {
        const status = error.response.status;
        let errorMessage = '로그인에 실패했습니다.';

        // 에러 응답 데이터 확인
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          if (status === 401) {
            errorMessage = '로그인에 실패했습니다.';
          }
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
      message: '로그인에 실패했습니다.',
    };
  }
}

/**
 * 로그아웃 Server Action
 *
 * @description
 * 저장된 토큰 쿠키를 모두 삭제합니다.
 * 토큰이 있는 경우에만 서버에 로그아웃 요청을 보냅니다.
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  // 토큰이 있는 경우에만 서버에 로그아웃 요청
  if (accessToken) {
    try {
      await serverApiWithToken.post('/auth/logout');
    } catch (error) {
      logErrorToDatabase(error, {
        actionName: 'logoutAction',
        skipAxiosError: true,
        errorType: BugReportErrorType.SERVER_ERROR,
      }).catch(() => {});
      console.error('Logout error:', error);
    }
  }

  // 저장되어 있던 모든 인증 관련 쿠키(액세스 토큰, 리프레시 토큰, 권한 부여 타입) 삭제
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
  cookieStore.delete('grant_type');
}
