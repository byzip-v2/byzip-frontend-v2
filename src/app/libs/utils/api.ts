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
import {
  getAccessToken,
  getUserId,
  refreshAccessToken,
} from '@/app/libs/utils/auth';
import { getUserAgent, getReferer } from '@/app/libs/utils/headers';
import { notifySlackBugReport } from '@/app/libs/utils/notifySlack';
import type { CreateBugReportDto } from 'byzip-v2-sdk';
import { BugReportErrorType, BugReportSeverity } from 'byzip-v2-sdk';

// User-Agent를 저장하기 위한 확장 타입
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  __userAgent?: string;
}

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
export const getApiBaseUrl = (): string => {
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
 * @param error - Axios 에러 객체 또는 일반 Error 객체
 * @returns BugReportErrorType
 */
const determineErrorType = (
  error: AxiosError | Error | unknown,
): BugReportErrorType => {
  // AxiosError인 경우 네트워크/HTTP 상태 코드 기반 판단
  if (axios.isAxiosError(error)) {
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
  }

  // Error 객체인 경우 name과 message 기반 판단
  if (error instanceof Error) {
    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    // Error 타입별 판단
    if (errorName === 'typeerror' || errorMessage.includes('type')) {
      return BugReportErrorType.TYPE_ERROR;
    }
    if (errorName === 'referenceerror' || errorMessage.includes('reference')) {
      return BugReportErrorType.REFERENCE_ERROR;
    }
    if (errorName === 'syntaxerror' || errorMessage.includes('syntax')) {
      return BugReportErrorType.SYNTAX_ERROR;
    }
    if (
      errorName === 'validationerror' ||
      errorMessage.includes('validation')
    ) {
      return BugReportErrorType.VALIDATION_ERROR;
    }
    if (errorName === 'runtimeerror' || errorMessage.includes('runtime')) {
      return BugReportErrorType.RUNTIME_ERROR;
    }
  }

  return BugReportErrorType.UNKNOWN;
};

/**
 * 에러 심각도를 자동으로 판단
 *
 * @param error - Axios 에러 객체 또는 일반 Error 객체
 * @returns BugReportSeverity
 */
const determineSeverity = (
  error: AxiosError | Error | unknown,
): BugReportSeverity => {
  // AxiosError인 경우 HTTP 상태 코드 기반 판단
  if (axios.isAxiosError(error)) {
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
  }

  // 일반 Error인 경우
  if (error instanceof Error) {
    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    // 심각한 에러 타입은 HIGH
    if (
      errorName === 'typeerror' ||
      errorName === 'referenceerror' ||
      errorMessage.includes('cannot read') ||
      errorMessage.includes('undefined')
    ) {
      return BugReportSeverity.HIGH;
    }

    // 일반적인 에러는 MEDIUM
    return BugReportSeverity.MEDIUM;
  }

  return BugReportSeverity.MEDIUM;
};

/**
 * 버그 리포트를 DB에 저장하는 공통 함수
 */
const createBugReport = async (
  bugReportData: CreateBugReportDto,
): Promise<void> => {
  const apiBaseUrl = getApiBaseUrl();

  // DB에 저장
  await axios
    .post(`${apiBaseUrl}/bug-reports`, bugReportData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000, // 5초 타임아웃
    })
    .catch((logError) => {
      console.warn(
        '🔍 [Error Logger] 버그 리포트 저장 실패:',
        logError.message,
      );
    });

  // Slack 알림 전송 (
  notifySlackBugReport(bugReportData);
};

/**
 * AxiosError를 로깅
 */
const logAxiosError = async (
  error: AxiosError,
  config: InternalAxiosRequestConfig,
  errorTypeOverride?: BugReportErrorType,
): Promise<void> => {
  try {
    const errorType = errorTypeOverride || determineErrorType(error);
    const severity = determineSeverity(error);

    // 에러 메시지 추출
    let errorMessage = 'Unknown error';
    if (error.response?.data) {
      if (
        typeof error.response.data === 'object' &&
        'message' in error.response.data
      ) {
        errorMessage = String(
          (error.response.data as { message?: string }).message,
        );
      } else {
        errorMessage = String(error.response.data);
      }
    } else {
      errorMessage = error.message || 'Unknown error';
    }

    // User-Agent 추출
    let userAgent: string | undefined;
    try {
      const extendedConfig = config as ExtendedAxiosRequestConfig;
      if (extendedConfig.__userAgent) {
        userAgent = extendedConfig.__userAgent;
      }
    } catch {
      // userAgent 추출 실패 시 undefined 유지
    }

    const userId = await getUserId();

    // 요청 URL 구성
    const baseURL = config.baseURL || getApiBaseUrl();
    const url = config.url ? `${baseURL}${config.url}` : baseURL;

    const method = config.method?.toUpperCase() || 'UNKNOWN';
    const endpoint = config.url || 'unknown';
    const title = `${method} ${endpoint}`;
    const description = `${method} ${endpoint} 요청 중 오류 발생: ${errorMessage}`;

    const errorCode = error.response?.status.toString() || '0';

    const metadata: Record<string, unknown> = {
      method: config.method,
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: config.headers,
      ...(error.response?.data ? { responseData: error.response.data } : {}),
    };

    await createBugReport({
      title,
      description,
      errorMessage,
      errorStack: error.stack,
      errorType,
      errorCode,
      url,
      userAgent,
      severity,
      userId,
      metadata,
    });
  } catch (logError) {
    console.warn('🔍 [Error Logger] 버그 리포트 저장 중 오류:', logError);
  }
};

/**
 * 일반 Error를 로깅
 */
const logGeneralError = async (
  error: Error | unknown,
  actionName?: string,
  errorTypeOverride?: BugReportErrorType,
): Promise<void> => {
  try {
    const errorType = errorTypeOverride || determineErrorType(error);
    const severity = determineSeverity(error);

    const errorMessage =
      error instanceof Error ? error.message : String(error) || 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // User-Agent 추출 (서버/클라이언트 환경 자동 감지)
    const userAgent = await getUserAgent();

    const userId = await getUserId();
    const url = await getReferer();

    let title: string;
    let description: string;
    if (actionName) {
      title = `Server Action Error: ${actionName}`;
      description = `Server Action "${actionName}" 실행 중 오류 발생: ${errorMessage}`;
    } else if (error instanceof Error) {
      title = `Error: ${error.name || 'Unknown'}`;
      description = `오류 발생: ${errorMessage}`;
    } else {
      title = 'Unknown Error';
      description = `오류 발생: ${errorMessage}`;
    }

    const metadata: Record<string, unknown> = {
      ...(actionName ? { actionName } : {}),
      errorName: error instanceof Error ? error.name : 'Unknown',
    };

    await createBugReport({
      title,
      description,
      errorMessage,
      errorStack,
      errorType,
      errorCode: undefined,
      url,
      userAgent,
      severity,
      userId,
      metadata,
    });
  } catch (logError) {
    console.warn('🔍 [Error Logger] 버그 리포트 저장 중 오류:', logError);
  }
};

/**
 * 에러 로깅 옵션
 */
interface LogErrorOptions {
  /** 요청 설정 객체 (AxiosError인 경우 필수) */
  config?: InternalAxiosRequestConfig;
  /** Server Action 이름 (일반 Error인 경우 사용) */
  actionName?: string;
  /** AxiosError인 경우 로깅을 건너뛸지 여부 (서버 액션에서 중복 로깅 방지용) */
  skipAxiosError?: boolean;
  /** 에러 타입 (지정하지 않으면 자동 판단) */
  errorType?: BugReportErrorType;
}

/**
 * 에러 정보를 수집하여 버그 리포트를 생성하고 DB에 저장
 *
 * @param error - Axios 에러 객체 또는 일반 Error 객체
 * @param options - 에러 로깅 옵션
 *
 * @description
 * 에러 발생 시 자동으로 버그 리포트를 생성하여 DB에 저장합니다.
 * 내부에서 AxiosError와 일반 Error를 자동으로 구분하여 처리합니다.
 *
 * **중복 로깅 방지:**
 * - 서버 액션에서 `serverApiWithToken` 등을 사용할 때, AxiosError는 interceptor에서 이미 로깅됩니다.
 * - 따라서 서버 액션의 catch 블록에서는 `skipAxiosError: true`를 전달하여 중복 로깅을 방지하세요.
 *
 * @example
 * ```typescript
 * // AxiosError인 경우
 * logErrorToDatabase(error, { config: error.config });
 *
 * // 일반 Error인 경우 (Server Action)
 * logErrorToDatabase(error, { actionName: 'getUserInfo' });
 *
 * // 서버 액션에서 AxiosError 중복 로깅 방지
 * logErrorToDatabase(error, { actionName: 'getUserInfo', skipAxiosError: true });
 * ```
 */
export const logErrorToDatabase = async (
  error: AxiosError | Error | unknown,
  options?: LogErrorOptions,
): Promise<void> => {
  const { config, actionName, skipAxiosError, errorType } = options || {};

  // AxiosError이면 서버 액션 로깅 건너뛰기
  if (axios.isAxiosError(error) && skipAxiosError) {
    return;
  }

  if (axios.isAxiosError(error) && config) {
    await logAxiosError(error, config, errorType);
  } else {
    await logGeneralError(error, actionName, errorType);
  }
};

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
 * - 401 에러 시 리프레시 토큰으로 토큰 갱신 시도
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
        const userAgent = await getUserAgent();
        if (userAgent) {
          // config에 userAgent 저장 (에러 로깅 시 사용)
          (config as ExtendedAxiosRequestConfig).__userAgent = userAgent;
        }
      } catch {
        // userAgent 추출 실패 시 무시
      }

      // autoToken이 true인 경우에만 토큰 추가
      if (autoToken) {
        try {
          console.log('🔍 [Server API] 요청 인터셉터 실행');
          let accessToken = await getAccessToken();
          console.log('🔍 [Server API] 토큰:', accessToken);

          // accessToken이 없는 경우 리프레시 토큰으로 갱신 시도
          if (!accessToken) {
            try {
              // 서버 전용 모듈 동적 import
              const { cookies } = await import('next/headers');
              const cookieStore = await cookies();
              const refreshToken = cookieStore.get('refresh_token')?.value;

              // 리프레시 토큰이 있으면 토큰 갱신 시도
              if (refreshToken) {
                console.log('🔍 [Server API] 리프레시 토큰으로 갱신 시도');
                const newTokens = await refreshAccessToken(refreshToken);

                if (newTokens) {
                  // 새 토큰을 쿠키에 저장
                  cookieStore.set('access_token', newTokens.accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 3600 * 24, // 1일
                    path: '/',
                  });

                  cookieStore.set('refresh_token', newTokens.refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 3600 * 24 * 30, // 30일
                    path: '/',
                  });

                  accessToken = newTokens.accessToken;
                  console.log('🔍 [Server API] 토큰 갱신 성공');
                } else {
                  // 토큰 갱신 실패 시 토큰 없이 요청 전송 (서버에서 401 받으면 응답 인터셉터에서 처리)
                  console.error(
                    '🔍 [Server API] 토큰 갱신 실패 - 토큰 없이 요청 전송',
                  );
                  accessToken = undefined;
                }
              } else {
                // 리프레시 토큰이 없으면 토큰 없이 요청 전송 (서버에서 401 받으면 응답 인터셉터에서 처리)
                console.log(
                  '🔍 [Server API] 리프레시 토큰이 없습니다 - 토큰 없이 요청 전송',
                );
              }
            } catch (refreshError) {
              console.warn(
                '🔍 [Server API] 리프레시 토큰 갱신 실패:',
                refreshError,
              );
              // 에러 발생 시에도 토큰 없이 요청 전송 (서버에서 401 받으면 응답 인터셉터에서 처리)
              accessToken = undefined;
            }
          }

          // 토큰이 있으면 헤더에 추가, 없으면 토큰 없이 요청 전송 (서버에서 401 처리)
          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        } catch (error) {
          // 예상치 못한 에러 발생 시에도 요청은 전송 (서버에서 처리)
          console.warn('🔍 [Server API] 토큰 처리 중 에러:', error);
          // 에러를 던지지 않고 토큰 없이 요청 전송
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
      console.log('🔍 [Server API] Response Error:', error.response?.status);

      // 401 에러 처리: Request Interceptor에서 이미 토큰 갱신을 시도했으므로
      // 여기서는 인증 실패로 간주하고 리다이렉트만 처리
      if (error.response?.status === 401) {
        console.log('🔍 [Server API] 401 에러 처리');
        // redirect()는 try/catch 블록 밖에서 호출해야 함 (Next.js 요구사항)
        const { redirect } = await import('next/navigation');
        redirect('/login');
      }

      // 에러 로깅
      console.error('🔍 [Server API] Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });

      // 버그 리포트 저장
      if (error.config) {
        logErrorToDatabase(error, { config: error.config }).catch(() => {});
      } else {
        // config가 없는 경우에도 로깅 시도
        logErrorToDatabase(error).catch(() => {});
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
 * 서버 사이드 API 클라이언트 인스턴스
 */
export const serverApiWithToken = createServerApi({ autoToken: true });
export const serverApiWithoutToken = createServerApi({ autoToken: false });
