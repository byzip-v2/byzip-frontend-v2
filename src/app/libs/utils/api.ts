/**
 * API 클라이언트 유틸리티
 * 환경에 따라 적절한 API 엔드포인트로 요청을 보냅니다.
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

// User-Agent를 저장하기 위한 확장 타입
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  __userAgent?: string;
}

import { headers } from 'next/headers';
import type { ApiError } from '@/app/libs/types/api';
import { getAccessToken, getUserId } from '@/app/libs/utils/auth';
import type { CreateBugReportDto } from 'byzip-v2-sdk';
import { BugReportErrorType, BugReportSeverity } from 'byzip-v2-sdk';

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
 * 에러 타입을 자동으로 판단
 *
 * @param error - Axios 에러 객체
 * @returns BugReportErrorType
 */
const determineErrorType = (error: AxiosError): BugReportErrorType => {
  // 네트워크 에러
  if (!error.response && error.request) {
    return BugReportErrorType.NETWORK_ERROR;
  }

  // HTTP 상태 코드 기반 판단
  if (error.response) {
    const status = error.response.status;
    if (status >= 500) {
      return BugReportErrorType.SERVER_ERROR;
    }
    if (status >= 400) {
      return BugReportErrorType.CLIENT_ERROR;
    }
  }

  // 에러 메시지 기반 판단
  const message = error.message?.toLowerCase() || '';
  if (
    message.includes('type') ||
    message.includes('undefined') ||
    message.includes('null')
  ) {
    return BugReportErrorType.TYPE_ERROR;
  }
  if (message.includes('reference')) {
    return BugReportErrorType.REFERENCE_ERROR;
  }
  if (message.includes('syntax')) {
    return BugReportErrorType.SYNTAX_ERROR;
  }
  if (message.includes('validation')) {
    return BugReportErrorType.VALIDATION_ERROR;
  }
  if (message.includes('runtime')) {
    return BugReportErrorType.RUNTIME_ERROR;
  }

  return BugReportErrorType.UNKNOWN;
};

/**
 * 에러 심각도를 자동으로 판단
 *
 * @param error - Axios 에러 객체
 * @returns BugReportSeverity
 */
const determineSeverity = (error: AxiosError): BugReportSeverity => {
  // HTTP 상태 코드 기반 판단
  if (error.response) {
    const status = error.response.status;
    if (status >= 500) {
      return BugReportSeverity.HIGH;
    }
    if (status === 401 || status === 403) {
      return BugReportSeverity.HIGH;
    }
    if (status >= 400) {
      return BugReportSeverity.MEDIUM;
    }
  }

  // 네트워크 에러는 medium
  if (!error.response && error.request) {
    return BugReportSeverity.MEDIUM;
  }

  return BugReportSeverity.LOW;
};

/**
 * 에러 정보를 수집하여 버그 리포트를 생성하고 DB에 저장
 *
 * @param error - Axios 에러 객체
 * @param config - 요청 설정 객체
 * @param userId - 사용자 ID (선택적)
 *
 * @description
 * 에러 발생 시 자동으로 버그 리포트를 생성하여 DB에 저장합니다.
 * 이 함수는 비동기로 실행되며, 실패해도 원래 에러 처리에 영향을 주지 않습니다.
 */
const logErrorToDatabase = async (
  error: AxiosError,
  config: InternalAxiosRequestConfig,
): Promise<void> => {
  try {
    const errorType = determineErrorType(error);
    const severity = determineSeverity(error);

    // 요청 URL 구성
    const baseURL = config.baseURL || getApiBaseUrl();
    const url = config.url ? `${baseURL}${config.url}` : baseURL;

    // 에러 메시지 추출
    const errorMessage = error.response?.data
      ? typeof error.response.data === 'object' &&
        'message' in error.response.data
        ? String((error.response.data as { message?: string }).message)
        : String(error.response.data)
      : error.message || 'Unknown error';

    // 에러 스택 추출
    const errorStack = error.stack || undefined;

    // User-Agent 추출
    let userAgent: string | undefined = undefined;
    try {
      // 요청 인터셉터에서 저장한 userAgent 사용
      const extendedConfig = config as ExtendedAxiosRequestConfig;
      if (extendedConfig.__userAgent) {
        userAgent = extendedConfig.__userAgent;
      }
    } catch {
      // userAgent 추출 실패 시 undefined 유지
    }

    // JWT에서 userId 추출
    let userId: string | undefined;
    try {
      userId = await getUserId();
    } catch {
      // userId 추출 실패 시 undefined 유지
    }

    // 버그 리포트 데이터 구성
    const bugReportData: CreateBugReportDto = {
      title: `${config.method?.toUpperCase()} ${config.url || 'unknown'}`,
      description: `${config.method?.toUpperCase()} ${config.url || 'unknown'} 요청 중 오류 발생: ${errorMessage}`,
      errorMessage,
      errorStack,
      errorType,
      errorCode: error.response?.status?.toString() || '0',
      url,
      userAgent,
      severity,
      userId,
      metadata: {
        method: config.method,
        baseURL: config.baseURL,
        timeout: config.timeout,
        headers: config.headers,
        ...(error.response?.data ? { responseData: error.response.data } : {}),
      },
    };

    // 버그 리포트 API 호출 (에러가 발생해도 무시)
    const apiBaseUrl = getApiBaseUrl();
    await axios
      .post(`${apiBaseUrl}/bug-reports`, bugReportData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5초 타임아웃
      })
      .catch((logError) => {
        // 버그 리포트 저장 실패는 조용히 무시 (무한 루프 방지)
        console.warn(
          '🔍 [Server API] 버그 리포트 저장 실패:',
          logError.message,
        );
      });
  } catch (logError) {
    // 버그 리포트 저장 중 예외 발생 시 조용히 무시
    console.warn('🔍 [Server API] 버그 리포트 저장 중 오류:', logError);
  }
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
 * @param options - API 클라이언트 설정 옵션
 * @param options.autoToken - 자동으로 토큰을 추가할지 여부
 * @returns {AxiosInstance} 서버 사이드용 Axios 인스턴스
 *
 * @description
 * Server Actions에서 사용할 수 있는 API 클라이언트입니다.
 * 공통 설정과 에러 처리가 미리 적용되어 있습니다.
 *
 * **기본 설정:**
 * - baseURL: 환경변수에서 가져온 API URL
 * - timeout: 10초
 * - headers: Content-Type: application/json
 *
 * **요청 인터셉터:**
 * - 요청 로깅
 * - autoToken이 true인 경우 자동으로 토큰 추가
 *
 * **응답 인터셉터:**
 * - 응답 로깅
 * - 에러 표준화
 * - 네트워크 에러 처리
 *
 */
export const createServerApi = (options: {
  autoToken: boolean;
}): AxiosInstance => {
  const { autoToken } = options;

  const instance = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 요청 인터셉터
  instance.interceptors.request.use(
    async (config) => {
      // 요청 로깅
      console.log(
        `🔍 [Server API] ${config.method?.toUpperCase()} ${config.url}`,
      );

      try {
        const headersList = await headers();
        const userAgent = headersList.get('user-agent');
        if (userAgent) {
          // config에 userAgent 저장 (에러 로깅 시 사용)
          (config as ExtendedAxiosRequestConfig).__userAgent = userAgent;
        }
      } catch {
        // headers() 사용 실패 시 무시 (클라이언트 사이드 또는 다른 환경)
      }

      // autoToken이 true인 경우에만 토큰 추가
      if (autoToken) {
        try {
          const accessToken = await getAccessToken();

          if (!accessToken) {
            throw new Error('로그인이 필요합니다.');
          }

          config.headers.Authorization = `Bearer ${accessToken}`;
        } catch (error) {
          // 토큰이 없거나 가져오기 실패 시 에러 반환
          console.warn('🔍 [Server API] 토큰을 가져올 수 없습니다:', error);
          throw error;
        }
      }

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
    async (error: AxiosError) => {
      // 에러 로깅
      console.error('🔍 [Server API] Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });

      // 버그 리포트 저장
      if (error.config) {
        logErrorToDatabase(error, error.config).catch(() => {});
      }

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
export const clientApi = createApiClient();

/**
 * 서버 사이드 API 클라이언트 인스턴스
 */
export const serverApiWithToekn = createServerApi({ autoToken: true });
export const serverApiWithoutToken = createServerApi({ autoToken: false });
