/**
 * API 클라이언트 유틸리티
 * 환경에 따라 적절한 API 엔드포인트로 요청을 보냅니다.
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError } from '@/app/libs/types/api';

/**
 * API 기본 URL 가져오기
 *
 * @returns {string} API 기본 URL
 *
 * @description
 * 환경변수 NEXT_PUBLIC_API_URL에서 API URL을 읽어옵니다.
 * 환경변수가 설정되지 않은 경우 개발 환경 URL을 기본값으로 반환합니다.
 *
 * @example
 * ```typescript
 * const apiUrl = getApiBaseUrl();
 * ```
 */
const getApiBaseUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // 환경변수가 설정되지 않은 경우 경고 로그 출력
  if (!apiUrl) {
    console.warn(
      'NEXT_PUBLIC_API_URL이 설정되지 않았습니다. 기본값(dev)을 사용합니다.',
    );
    return 'https://dev-api.by-zip.com';
  }

  return apiUrl;
};

/**
 * Axios 인스턴스 생성
 *
 * @returns {AxiosInstance} 설정이 적용된 Axios 인스턴스
 *
 * @description
 * 공통 설정이 적용된 API 클라이언트를 생성합니다.
 *
 * **기본 설정:**
 * - baseURL: 환경변수에서 가져온 API URL
 * - timeout: 10초
 * - headers: Content-Type: application/json
 *
 * **요청 인터셉터:**
 * - localStorage의 accessToken을 자동으로 Authorization 헤더에 추가
 * - Bearer Token 방식 사용
 *
 * **응답 인터셉터:**
 * - 네트워크 에러를 ApiError 형식으로 변환
 * - API 에러 응답을 표준화된 형식으로 변환
 *
 * @example
 * ```typescript
 * const client = createApiClient();
 * const response = await client.get('/users/me');
 * ```
 */
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 10000, // 10초 타임아웃
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 요청 인터셉터: 토큰이 있는 경우 자동으로 헤더에 추가
  instance.interceptors.request.use(
    (config) => {
      // 브라우저 환경에서만 localStorage 접근
      if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // 응답 인터셉터: 에러 처리 표준화
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
      // 네트워크 에러 처리
      if (!error.response) {
        return Promise.reject({
          message: '네트워크 연결을 확인해주세요.',
          statusCode: 0,
          error: 'NetworkError',
        } as ApiError);
      }

      // API 에러 응답 처리
      const apiError: ApiError = {
        message:
          error.response.data?.message || '알 수 없는 오류가 발생했습니다.',
        statusCode: error.response.status,
        error: error.response.data?.error,
      };

      return Promise.reject(apiError);
    },
  );

  return instance;
};

/**
 * API 클라이언트 인스턴스
 *
 * @description
 * 애플리케이션 전체에서 재사용되는 Axios 인스턴스입니다.
 * 자동으로 토큰 인증 헤더를 추가하고, 에러를 표준화된 형식으로 변환합니다.
 *
 * @example
 * ```typescript
 * import { apiClient } from '@/app/libs/utils/api-client';
 *
 * // GET 요청
 * const response = await apiClient.get('/users/me');
 *
 * // POST 요청
 * const response = await apiClient.post('/auth/login', {
 *   userId: 'admin',
 *   password: 'password123'
 * });
 * ```
 */
/**
 * Server Actions용 API 클라이언트 생성
 *
 * @returns {AxiosInstance} 서버 사이드용 Axios 인스턴스
 *
 * @description
 * Server Actions에서 사용할 수 있는 API 클라이언트입니다.
 * 공통 설정과 에러 처리가 미리 적용되어 있습니다.
 *
 * **기본 설정:**
 * - baseURL: 환경변수에서 가져온 API URL
 * - timeout: 10초
 * - headers: Content-Type: application/json, User-Agent
 * - withCredentials: false (서버 사이드에서는 불필요)
 *
 * **요청 인터셉터:**
 * - 요청 로깅
 * - 공통 헤더 추가
 *
 * **응답 인터셉터:**
 * - 응답 로깅
 * - 에러 표준화
 * - 네트워크 에러 처리
 *
 * @example
 * ```typescript
 * // Server Action에서 사용
 * const response = await serverApiClient.post('/auth/login', data);
 * const response = await serverApiClient.get('/users/me');
 * ```
 */
export const createServerApi = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 요청 인터셉터
  instance.interceptors.request.use(
    (config) => {
      // 요청 로깅
      console.log(
        `🔍 [Server API] ${config.method?.toUpperCase()} ${config.url}`,
      );

      return config;
    },
    (error) => {
      console.error('🔍 [Server API] Request Error:', error);
      return Promise.reject(error);
    },
  );

  // 응답 인터셉터
  instance.interceptors.response.use(
    (response) => {
      // 성공 응답 로깅
      console.log(`🔍 [Server API] ${response.status} ${response.config.url}`);
      return response;
    },
    (error: AxiosError) => {
      // 에러 로깅
      console.error('🔍 [Server API] Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });

      // 에러 표준화
      if (error.response) {
        // HTTP 에러 응답 (4xx, 5xx)
        const responseData = error.response.data as { message?: string } | null;
        const apiError: ApiError = {
          message: responseData?.message || error.message,
          statusCode: error.response.status,
          error: error.response.statusText,
        };
        error.response.data = apiError;
      } else if (error.request) {
        // 네트워크 에러
        const networkError: ApiError = {
          message: '네트워크 연결을 확인해주세요.',
          statusCode: 0,
          error: 'Network Error',
        };
        error.response = {
          data: networkError,
          status: 0,
          statusText: 'Network Error',
          headers: {},
          config: error.config || ({} as InternalAxiosRequestConfig),
        };
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

/**
 * 클라이언트 사이드 API 클라이언트 인스턴스
 */
export const apiClient = createApiClient();

/**
 * 서버 사이드 API 클라이언트 인스턴스
 */
export const serverApi = createServerApi();
