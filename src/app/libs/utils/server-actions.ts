/**
 * Next.js 리다이렉트 에러인지 확인하는 헬퍼 함수
 */
export function isRedirectError(
  error: unknown,
): error is Error & { digest?: string } {
  if (!(error instanceof Error)) return false;
  if (error.message === 'NEXT_REDIRECT') return true;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT');
}

/**
 * 리다이렉트 에러를 Next.js가 처리하도록 다시 던지는 함수
 *
 * @param error - 처리할 에러 객체
 * @throws NEXT_REDIRECT 에러인 경우 에러를 다시 던짐
 *
 * @description
 * Response Interceptor에서 401 에러 처리 시 클라이언트에 NEXT_REDIRECT 응답 반환
 *
 * @example
 * ```typescript
 * try {
 *   // Server Action 로직
 * } catch (error) {
 *   rethrowRedirectError(error); // NEXT_REDIRECT 에러는 자동으로 위임
 *   // 일반 에러 처리...
 * }
 * ```
 */
export function handleNextRedirectError(error: unknown): void {
  if (isRedirectError(error)) {
    throw error; // Next.js가 처리하도록 위임
  }
}
