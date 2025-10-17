'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * 인증 관련 유틸리티 함수들
 */

/**
 * 현재 사용자의 로그인 상태를 확인합니다.
 *
 * @returns 로그인 여부 (boolean)
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken');

  return !!accessToken?.value;
}

/**
 * 로그인된 사용자만 접근할 수 있는 페이지에서 사용합니다.
 * 로그인되지 않은 경우 로그인 페이지로 리다이렉트합니다.
 *
 * @param redirectTo - 리다이렉트할 경로 (기본값: '/login')
 */
export async function requireAuth(
  redirectTo: string = '/login',
): Promise<void> {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect(redirectTo);
  }
}

/**
 * 로그인된 사용자가 접근할 수 없는 페이지에서 사용합니다.
 * 로그인된 경우 지정된 페이지로 리다이렉트합니다.
 *
 * @param redirectTo - 리다이렉트할 경로 (기본값: '/admin')
 */
export async function requireGuest(
  redirectTo: string = '/admin',
): Promise<void> {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect(redirectTo);
  }
}
