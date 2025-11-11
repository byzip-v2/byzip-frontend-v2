'use server';

import { cookies } from 'next/headers';

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
  const accessToken = cookieStore.get('accessToken');

  return accessToken?.value;
}
