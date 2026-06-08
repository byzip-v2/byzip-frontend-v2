'use server';

import {
  serverApiWithoutToken,
  logErrorToDatabase,
} from '@/app/libs/utils/api';
import type { ActionResult } from '@/app/libs/types/api';
import { handleNextRedirectError } from '@/app/libs/utils/server-actions';
import { BugReportErrorType, HousingSupplyResponseDto } from 'byzip-v2-sdk';
import axios from 'axios';
import { Meta } from '@storybook/nextjs';

/**
 * 주택 공급 정보 목록 조회 쿼리 파라미터 타입
 */
export interface GetHousingSuppliesParams {
  search?: string;
  houseSecd?: string;
  subscrptAreaCode?: string;
  subscrptAreaCodeNm?: string;
  rcritPblancDeFrom?: string;
  rcritPblancDeTo?: string;
  rceptBgndeFrom?: string;
  rceptBgndeTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  recruiting?:boolean
}

/**
 * 주택 공급 정보 목록 조회 결과 데이터 타입
 */
export interface GetHousingSuppliesResultData {
  items: HousingSupplyResponseDto[];
  meta: Meta;
}

/**
 * 사용자용 주택 공급 정보 목록을 조회하는 Server Action
 */
export async function getPublicHousingSupplies(
  params: GetHousingSuppliesParams,
): Promise<ActionResult<GetHousingSuppliesResultData>> {
  try {
    const response = await serverApiWithoutToken.get('/housing-supplies', {
      params,
    });

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
        items: response.data.data,
        meta: response.data.meta,
      },
    };
  } catch (error) {
    handleNextRedirectError(error);

    console.error('🔍 [getPublicHousingSupplies] 에러 발생:', error);
    logErrorToDatabase(error, {
      actionName: 'getPublicHousingSupplies',
      skipAxiosError: true,
      errorType: BugReportErrorType.SERVER_ERROR,
    }).catch(() => { });

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
