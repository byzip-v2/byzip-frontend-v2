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
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * 주택 공급 정보 목록 조회 결과 데이터 타입
 */
export interface GetHousingSuppliesResultData {
    items: HousingSupplyDataDto[];
    meta: GetHousingSuppliesResponseDto['meta'];
}

/**
 * 주택 공급 정보 목록을 조회하는 Server Action
 */
export async function getHousingSupplies(
    params: GetHousingSuppliesParams,
): Promise<ActionResult<GetHousingSuppliesResultData>> {
    try {
        const response = await serverApiWithToken.get<GetHousingSuppliesResponseDto>(
            '/housing-supplies',
            { params },
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
            data: {
                items: response.data.data,
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

/**
 * 주택 공급 정보를 숨기거나 해제하는 Server Action
 */
export async function toggleHousingSupplyHidden(
    id: number,
    isHidden: boolean,
): Promise<ActionResult<HousingSupplyDataDto>> {
    try {
        const response = await serverApiWithToken.patch<{ success: boolean; message: string; data: HousingSupplyDataDto }>(
            `/housing-supplies/${id}`,
            { isHidden },
        );

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
        }).catch(() => { });

        if (axios.isAxiosError(error) && error.response) {
            return {
                success: false,
                message:
                    error.response.data?.message || '정보 업데이트 중 오류가 발생했습니다.',
            };
        }

        return {
            success: false,
            message: '정보 업데이트 중 오류가 발생했습니다.',
        };
    }
}
