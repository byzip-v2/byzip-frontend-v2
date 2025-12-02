/**
 * 헤더 유틸리티
 * 서버/클라이언트 환경에 따라 적절한 방법으로 헤더 정보를 추출합니다.
 * 서버 환경에서는 next/headers를 사용하고, 클라이언트 환경에서는 window.navigator를 사용합니다.
 * 클라이언트 환경에서도 'utils/api.ts' 사용 하기 위해 함수 분리
 */

/**
 * User-Agent를 가져옵니다.
 * 서버 환경에서는 next/headers를 사용하고, 클라이언트 환경에서는 window.navigator를 사용합니다.
 *
 * @returns {Promise<string | undefined>} User-Agent 문자열 또는 undefined
 */
export const getUserAgent = async (): Promise<string | undefined> => {
  // 클라이언트 환경
  if (typeof window !== 'undefined') {
    return window.navigator.userAgent || undefined;
  }

  // 서버 환경
  try {
    // 동적 import를 사용하여 서버 환경에서만 next/headers를 로드
    const { headers } = await import('next/headers');
    const headersList = await headers();
    return headersList.get('user-agent') || undefined;
  } catch {
    // headers() 사용 실패 시 (클라이언트 사이드 또는 다른 환경)
    return undefined;
  }
};

/**
 * Referer URL을 가져옵니다.
 * 서버 환경에서는 next/headers를 사용하고, 클라이언트 환경에서는 window.location을 사용합니다.
 *
 * @returns {Promise<string>} Referer URL 또는 'unknown'
 */
export const getReferer = async (): Promise<string> => {
  // 클라이언트 환경
  if (typeof window !== 'undefined') {
    return window.location.href || 'unknown';
  }

  // 서버 환경
  try {
    // 동적 import를 사용하여 서버 환경에서만 next/headers를 로드
    const { headers } = await import('next/headers');
    const headersList = await headers();
    return headersList.get('referer') || 'unknown';
  } catch {
    // headers() 사용 실패 시
    return 'unknown';
  }
};
