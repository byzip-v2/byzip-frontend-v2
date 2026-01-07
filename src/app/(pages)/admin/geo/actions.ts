'use server';

import { serverApiWithToken, logErrorToDatabase } from '@/app/libs/utils/api';
import type { ActionResult } from '@/app/libs/types/api';
import { handleNextRedirectError } from '@/app/libs/utils/server-actions';
import {
  BugReportErrorType,
  GetHousingSuppliesResponseDto,
  HousingSupplyDataDto,
} from 'byzip-v2-sdk';
import axios from 'axios';

/**
 * 좌표가 없는 주택 공급 데이터를 조회하는 Server Action
 */
export async function getMissingCoordinates(): Promise<
  ActionResult<HousingSupplyDataDto[]>
> {
  try {
    const response =
      await serverApiWithToken.get<GetHousingSuppliesResponseDto>(
        '/housing-supplies/missing-coordinates',
      );

    if (response.status !== 200 || !response.data.success) {
      return {
        success: false,
        message: response.data.message || '데이터를 가져오는데 실패했습니다.',
      };
    }

    return {
      success: true,
      message: '데이터를 성공적으로 가져왔습니다.',
      data: response.data.data,
    };
  } catch (error) {
    handleNextRedirectError(error);

    console.error('🔍 [getMissingCoordinates] 에러 발생:', error);
    logErrorToDatabase(error, {
      actionName: 'getMissingCoordinates',
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
