'use server';

import axios from 'axios';
import { BaseResponseDto, TokenDataDto } from 'byzip-v2-sdk';
import { cookies } from 'next/headers';
import { getApiBaseUrl } from './api';

/**
 * 인증 관련 유틸리티 함수들
 */

/**
 * 현재 사용자의 accessToken을 반환
 *
 * @returns accessToken 값 (string | undefined)
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token');

  return accessToken?.value;
}

/**
 * JWT 토큰에서 userId를 추출
 *
 * @param token - JWT 토큰
 * @returns userId (string | undefined)
 *
 * @description
 * JWT 토큰의 payload를 디코딩하여 userId를 추출합니다.
 * 토큰이 유효하지 않거나 userId가 없는 경우 undefined를 반환합니다.
 */
export async function getUserIdFromToken(
  token: string,
): Promise<string | undefined> {
  try {
    // JWT 토큰은 header.payload.signature 형식
    const parts = token.split('.');
    if (parts.length !== 3) {
      return undefined;
    }

    // payload 부분 디코딩 (base64url)
    const payload = parts[1];
    // base64url을 base64로 변환 (필요한 경우)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);

    // userId 또는 sub (subject) 필드에서 userId 추출
    return parsed.userId || parsed.sub || parsed.id || undefined;
  } catch {
    // 토큰 디코딩 실패 시 undefined 반환
    return undefined;
  }
}

/**
 * 현재 사용자의 userId를 반환
 *
 * @returns userId (string | undefined)
 *
 * @description
 * 쿠키에서 accessToken을 가져와서 userId를 추출합니다.
 */
export async function getUserId(): Promise<string | undefined> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return undefined;
    }

    return await getUserIdFromToken(accessToken);
  } catch {
    return undefined;
  }
}

/**
 * 리프레시 토큰으로 새 액세스 토큰 발급 (서버 전용)
 *
 * @param refreshToken - 리프레시 토큰
 * @returns 새로 발급받은 토큰 데이터 (실패 시 null)
 */
export const refreshAccessToken = async (
  refreshToken: string,
): Promise<TokenDataDto | null> => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await axios.post<BaseResponseDto<TokenDataDto>>(
      `${apiBaseUrl}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      },
    );

    if (response.data.data?.accessToken && response.data.data?.refreshToken) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.warn('🔍 [Server API] 토큰 갱신 실패:', error);
    return null;
  }
};
