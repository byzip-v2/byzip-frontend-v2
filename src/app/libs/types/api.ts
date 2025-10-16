/**
 * API 공통 타입 정의
 */

/**
 * API 에러 응답 타입
 *
 * @description
 * HTTP 통신 에러나 네트워크 에러를 표현하는 타입입니다.
 * axios나 fetch의 에러를 처리할 때 사용합니다.
 *
 * @property message - 에러 메시지
 * @property statusCode - HTTP 상태 코드
 * @property error - 에러 타입 (선택)
 *
 * @example
 * ```typescript
 * const apiError: ApiError = {
 *   message: '사용자를 찾을 수 없습니다.',
 *   statusCode: 404,
 *   error: 'NotFound'
 * };
 * ```
 */
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
