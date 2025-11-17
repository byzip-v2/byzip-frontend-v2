'use server';

/**
 * 로그인 Server Actions
 * 서버 사이드에서 안전하게 인증 처리를 수행합니다.
 */

import { cookies } from 'next/headers';
import axios from 'axios';
import {
  BugReportErrorType,
  type BaseResponseDto,
  type LoginRequestDto,
  type TokenDataDto,
} from 'byzip-v2-sdk';
import {
  serverApiWithToken,
  serverApiWithoutToken,
  logErrorToDatabase,
} from '@/app/libs/utils/api';
import { ActionResult } from 'next/dist/server/app-render/types';

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
      userId: userId.trim(),
      password: password,
    };

    // API 요청 (serverApi 사용)
    const response = await serverApiWithoutToken.post<
      BaseResponseDto<TokenDataDto>
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

    cookieStore.set('accessToken', tokenData.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60, // 1분
      path: '/',
    });

    cookieStore.set('refreshToken', tokenData.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10분
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
      message: '로그인 중 오류가 발생했습니다. 다시 시도해주세요.',
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
  const accessToken = cookieStore.get('accessToken')?.value;

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

  // 토큰 쿠키 삭제
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}
