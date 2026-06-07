'use server';

import axios from 'axios';
import { BaseResponseDto, TokenResponseDto } from 'byzip-v2-sdk';
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
 * 현재 사용자의 grantType을 반환 (기본값 'Bearer')
 *
 * @returns grantType 값 (string)
 *
 * @description
 * 쿠키 저장소(cookies)에서 'grant_type' 키에 매핑된 값을 조회합니다.
 * 백엔드 API와의 통신 규격에 맞춰 Bearer 혹은 다른 권한 부여 방식을 동적으로 적용하기 위함입니다.
 * 만약 쿠키에 값이 존재하지 않는 경우, 안전한 기본 인증 방식인 'Bearer'를 반환합니다.
 */
export async function getGrantType(): Promise<string> {
  const cookieStore = await cookies();
  const grantType = cookieStore.get('grant_type');

  // 쿠키에 저장된 grant_type이 없을 경우 기본값으로 'Bearer'를 지정하여 인증이 끊기지 않도록 함
  return grantType?.value || 'Bearer';
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
): Promise<TokenResponseDto | null> => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await axios.post<BaseResponseDto<TokenResponseDto>>(
      `${apiBaseUrl}/auth/reissue`,
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
