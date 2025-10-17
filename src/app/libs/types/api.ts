/**
 * API 공통 타입 정의
 */

/**
 * API 응답 공통 타입
 *
 * @description
 * 모든 Server Actions에서 사용하는 공통 응답 타입입니다.
 * 성공/실패 여부와 메시지, 그리고 선택적으로 데이터를 포함합니다.
 *
 * @template T - 반환할 데이터의 타입 (선택적)
 *
 * @example
 * ```typescript
 * // 데이터가 있는 경우
 * const result: ApiResult<UserInfo> = {
 *   success: true,
 *   message: '사용자 정보를 성공적으로 가져왔습니다.',
 *   data: userInfo
 * };
 *
 * // 데이터가 없는 경우 (에러)
 * const result: ApiResult = {
 *   success: false,
 *   message: '로그인이 필요합니다.'
 * };
 * ```
 */
export interface ActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

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

/**
 * 사용자 정보 타입
 *
 * @description
 * /users/me API에서 반환하는 사용자 정보를 표현하는 타입입니다.
 *
 * @property userId - 사용자 아이디
 * @property name - 사용자 이름
 * @property email - 사용자 이메일
 * @property phoneNumber - 사용자 전화번호
 */
export interface UserInfo {
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
}


