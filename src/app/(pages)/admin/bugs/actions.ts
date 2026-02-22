'use server';

import { serverApiWithToken, logErrorToDatabase } from '@/app/libs/utils/api';
import type { ActionResult } from '@/app/libs/types/api';
import { handleNextRedirectError } from '@/app/libs/utils/server-actions';
import { BugReportDataDto, BugReportErrorType } from 'byzip-v2-sdk';
import axios from 'axios';
import { notifySlackAssigneeChange } from '@/app/libs/utils/notifySlack';

/**
 * 버그 리포트 목록 조회를 위한 쿼리 파라미터 타입
 */
export interface GetBugReportsParams {
  search?: string;
  status?: string;
  severity?: string;
  errorType?: string;
  userId?: string;
  assigneeId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface BugReportDataDtoWithMemo extends BugReportDataDto {
  memo: string;
}

/**
 * 페이지네이션 메타 데이터 타입
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  itemCount: number;
}

/**
 * 버그 리포트 목록 응답 타입
 */
export interface GetBugReportsResponse {
  success: boolean;
  message: string;
  data?: BugReportDataDtoWithMemo[];
  meta?: PaginationMeta;
}

/**
 * 버그 리포트 목록 조회 Server Action
 *
 * @param params - 검색, 필터링, 페이징 파라미터
 * @returns 버그 리포트 목록 및 메타 데이터
 */
export async function getBugReports(
  params: GetBugReportsParams = {},
): Promise<GetBugReportsResponse> {
  try {
    const response = await serverApiWithToken.get<GetBugReportsResponse>(
      '/bug-reports',
      {
        params: {
          ...params,
          page: params.page || 1,
          limit: params.limit || 10,
          sortBy: params.sortBy || 'createdAt',
          sortOrder: params.sortOrder || 'DESC',
        },
      },
    );

    if (response.status !== 200 || !response.data.success) {
      return {
        success: false,
        message:
          response.data.message ||
          '버그 리포트 목록을 가져오는데 실패했습니다.',
      };
    }

    return {
      success: true,
      message: '버그 리포트 목록을 성공적으로 가져왔습니다.',
      data: response.data.data,
      meta: response.data.meta,
    };
  } catch (error) {
    handleNextRedirectError(error);

    console.error('🔍 [getBugReports] 에러 발생:', error);
    logErrorToDatabase(error, {
      actionName: 'getBugReports',
      skipAxiosError: true,
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});

    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message:
          error.response.data?.message ||
          '버그 리포트 목록 조회 중 오류가 발생했습니다.',
      };
    }

    return {
      success: false,
      message: '버그 리포트 목록 조회 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 버그 리포트 업데이트를 위한 DTO
 */
export interface UpdateBugReportDto {
  status?: string;
  assigneeId?: string | null;
  memo?: string;
  severity?: string;
}

/**
 * 버그 리포트 상세 업데이트 Server Action
 *
 * @param id - 버그 리포트 ID
 * @param data - 업데이트할 필드 (status, assigneeId, memo, severity)
 * @returns 업데이트 결과
 */
export async function updateBugReport(
  id: number,
  data: UpdateBugReportDto,
  prevAssignee: string,
): Promise<ActionResult<BugReportDataDtoWithMemo>> {
  try {
    const response = await serverApiWithToken.patch<{
      success: boolean;
      message?: string;
      data: BugReportDataDtoWithMemo;
    }>(`/bug-reports/${id}`, data);

    if (response.status !== 200 || !response.data.success) {
      return {
        success: false,
        message:
          response.data.message || '버그 리포트를 업데이트하는데 실패했습니다.',
      };
    }

    // 담당자 변경이 발생한 경우 Slack 알림을 전송합니다.
    try {
      const newAssignee = response.data.data.assigneeId ?? null;
      // prevAssignee 파라미터는 클라이언트에서 빈 문자열('')으로 전달할 수 있으므로 null로 정규화합니다.
      const prevNorm = prevAssignee === '' ? null : prevAssignee;

      // "미지정"(null)로 변경한 경우에는 알림을 보내지 않습니다.
      if (newAssignee !== null && prevNorm !== newAssignee) {
        await notifySlackAssigneeChange({
          bugId: id,
          title: response.data.data.title,
          nextAssignee: newAssignee,
          occurredAt: String(response.data.data.createdAt),
        });
      }
    } catch (e) {
      // 알림 실패는 전체 작업 실패로 간주하지 않음
      console.warn('[updateBugReport] 담당자 변경 알림 전송 중 오류:', e);
    }

    return {
      success: true,
      message: '버그 리포트가 성공적으로 업데이트되었습니다.',
      data: response.data.data,
    };
  } catch (error) {
    handleNextRedirectError(error);

    console.error('🔍 [updateBugReport] 에러 발생:', error);
    logErrorToDatabase(error, {
      actionName: 'updateBugReport',
      skipAxiosError: true,
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});

    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message:
          error.response.data?.message ||
          '버그 리포트 업데이트 중 오류가 발생했습니다.',
      };
    }

    return {
      success: false,
      message: '버그 리포트 업데이트 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 여러 버그 리포트의 상태를 한꺼번에 변경하는 Server Action
 *
 * @param ids - 버그 리포트 ID 배열
 * @param status - 변경할 상태
 * @returns 처리 결과
 */
export async function bulkUpdateBugStatus(
  ids: number[],
  status: string,
): Promise<ActionResult> {
  try {
    const response = await serverApiWithToken.patch<{
      success: boolean;
      message?: string;
    }>('/bug-reports/bulk-status', { ids, status });

    if (response.status !== 200 || !response.data.success) {
      return {
        success: false,
        message: response.data.message || '일괄 업데이트에 실패했습니다.',
      };
    }

    return {
      success: true,
      message: '일괄 업데이트가 성공적으로 완료되었습니다.',
    };
  } catch (error) {
    handleNextRedirectError(error);

    console.error('🔍 [bulkUpdateBugStatus] 에러 발생:', error);
    logErrorToDatabase(error, {
      actionName: 'bulkUpdateBugStatus',
      skipAxiosError: true,
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});

    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message:
          error.response.data?.message ||
          '일괄 업데이트 중 오류가 발생했습니다.',
      };
    }

    return {
      success: false,
      message: '일괄 업데이트 중 오류가 발생했습니다.',
    };
  }
}
