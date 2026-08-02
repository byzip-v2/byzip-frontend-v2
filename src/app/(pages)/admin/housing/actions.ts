'use server';

import { serverApiWithToken, logErrorToDatabase } from '@/app/libs/utils/api';
import type { ActionResult } from '@/app/libs/types/api';
import { handleNextRedirectError } from '@/app/libs/utils/server-actions';
import {
  BugReportErrorType,
  HousingSupplyResponseDto,
  Meta,
  ApiResponse,
} from 'byzip-v2-sdk';
import axios from 'axios';

/**
 * 주택 공급 정보 목록 조회 쿼리 파라미터 타입
 */
export interface GetHousingSuppliesParams {
  search?: string;
  houseSecd?: string;
  houseSecdNm?: string;
  houseDtlSecd?: string;
  rentSecd?: string;
  subscrptAreaCodeNm?: string;
  rcritPblancDeFrom?: string;
  rcritPblancDeTo?: string;
  rceptBgndeFrom?: string;
  rceptBgndeTo?: string;
  parcprcUlsAt?: string;
  specltRdnEarthAt?: string;
  isHidden?: boolean;
  includeEnded?: boolean;
  recruiting?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 주택 공급 정보 목록 조회 결과 데이터 타입
 */
export interface GetHousingSuppliesResultData {
  items: HousingSupplyResponseDto[];
  meta: Meta;
}

/**
 * 주택 공급 정보 목록을 조회하는 Server Action
 */
export async function getHousingSupplies(
  params: GetHousingSuppliesParams,
): Promise<ActionResult<GetHousingSuppliesResultData>> {
  try {
    const response = await serverApiWithToken.get<
      ApiResponse<HousingSupplyResponseDto[]>
    >('/housing-supplies', { params });
    if (response.status !== 200 || !response.data.success) {
      return {
        success: false,
        message: response.data.message || '데이터를 가져오는데 실패했습니다.',
      };
    }

    return {
      success: true,
      message: '데이터를 성공적으로 가져왔습니다.',
      data: {
        items: response?.data?.data,
        meta: response.data.meta,
      },
    };
  } catch (error) {
    handleNextRedirectError(error);

    console.error('🔍 [getHousingSupplies] 에러 발생:', error);
    logErrorToDatabase(error, {
      actionName: 'getHousingSupplies',
      skipAxiosError: true,
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});

    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message:
          error.response.data?.message || '데이터 조회 중 오류가 발생했습니다.',
      };
    }

    return {
      success: false,
      message: '데이터 조회 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 주택 공급 정보를 숨기거나 해제하는 Server Action
 */
export async function toggleHousingSupplyHidden(
  id: number,
  isHidden: boolean,
): Promise<ActionResult<ApiResponse<HousingSupplyResponseDto[]>>> {
  try {
    const response = await serverApiWithToken.patch<{
      success: boolean;
      message: string;
      data: ApiResponse<HousingSupplyResponseDto[]>;
    }>(`/housing-supplies/${id}`, { isHidden });

    if (response.status !== 200 || !response.data.success) {
      return {
        success: false,
        message: response.data.message || '정보를 업데이트하는데 실패했습니다.',
      };
    }

    return {
      success: true,
      message: '정보가 성공적으로 업데이트되었습니다.',
      data: response.data.data,
    };
  } catch (error) {
    handleNextRedirectError(error);

    console.error('🔍 [toggleHousingSupplyHidden] 에러 발생:', error);
    logErrorToDatabase(error, {
      actionName: 'toggleHousingSupplyHidden',
      skipAxiosError: true,
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});

    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message:
          error.response.data?.message ||
          '정보 업데이트 중 오류가 발생했습니다.',
      };
    }

    return {
      success: false,
      message: '정보 업데이트 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 여러 주택 공급 정보를 한 번에 숨기거나 해제하는 Server Action
 * @param ids - 대상 id 배열
 * @param isHidden - 숨김 여부
 */
export async function bulkHideHousingSupplies(
  ids: number[],
  isHidden: boolean,
): Promise<ActionResult<null>> {
  try {
    // 각 id마다 병렬로 PATCH 요청
    const results = await Promise.allSettled(
      ids.map((id) =>
        serverApiWithToken.patch<{ success: boolean; message: string }>(
          `/housing-supplies/${id}`,
          { isHidden },
        ),
      ),
    );

    // 실패한 항목 수 집계
    const failedCount = results.filter((r) => r.status === 'rejected').length;

    if (failedCount > 0) {
      return {
        success: false,
        message: `${ids.length}건 중 ${failedCount}건 변경에 실패했습니다.`,
      };
    }

    return {
      success: true,
      message: `${ids.length}건의 숨김 상태가 변경되었습니다.`,
      data: null,
    };
  } catch (error) {
    handleNextRedirectError(error);

    console.error('🔍 [bulkHideHousingSupplies] 에러 발생:', error);
    logErrorToDatabase(error, {
      actionName: 'bulkHideHousingSupplies',
      skipAxiosError: true,
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});

    return {
      success: false,
      message: '일괄 숨김 처리 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 여러 주택 공급 정보를 한 번에 삭제하는 Server Action
 * @param ids - 삭제할 id 배열
 */
export async function bulkDeleteHousingSupplies(
  ids: number[],
): Promise<ActionResult<null>> {
  try {
    // 각 id마다 병렬로 DELETE 요청
    const results = await Promise.allSettled(
      ids.map((id) =>
        serverApiWithToken.delete<{ success: boolean; message: string }>(
          `/housing-supplies/${id}`,
        ),
      ),
    );

    // 실패한 항목 수 집계
    const failedCount = results.filter((r) => r.status === 'rejected').length;

    if (failedCount > 0) {
      return {
        success: false,
        message: `${ids.length}건 중 ${failedCount}건 삭제에 실패했습니다.`,
      };
    }

    return {
      success: true,
      message: `${ids.length}건이 삭제되었습니다.`,
      data: null,
    };
  } catch (error) {
    handleNextRedirectError(error);

    console.error('🔍 [bulkDeleteHousingSupplies] 에러 발생:', error);
    logErrorToDatabase(error, {
      actionName: 'bulkDeleteHousingSupplies',
      skipAxiosError: true,
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});

    return {
      success: false,
      message: '일괄 삭제 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 단일 주택 공급 공고를 삭제하는 Server Action
 * 드로어의 '삭제' 버튼 클릭 시 호출됩니다.
 * @param id - 삭제할 공고의 id
 */
export async function deleteHousingSupply(
  id: number,
): Promise<ActionResult<null>> {
  try {
    const response = await serverApiWithToken.delete<{
      success: boolean;
      message: string;
    }>(`/housing-supplies/${id}`);

    if (response.status !== 200 || !response.data.success) {
      return {
        success: false,
        message: response.data.message || '공고 삭제에 실패했습니다.',
      };
    }

    return {
      success: true,
      message: '공고가 성공적으로 삭제되었습니다.',
      data: null,
    };
  } catch (error) {
    handleNextRedirectError(error);

    console.error('🔍 [deleteHousingSupply] 에러 발생:', error);
    logErrorToDatabase(error, {
      actionName: 'deleteHousingSupply',
      skipAxiosError: true,
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => {});

    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message:
          error.response.data?.message || '공고 삭제 중 오류가 발생했습니다.',
      };
    }

    return {
      success: false,
      message: '공고 삭제 중 오류가 발생했습니다.',
    };
  }
}
