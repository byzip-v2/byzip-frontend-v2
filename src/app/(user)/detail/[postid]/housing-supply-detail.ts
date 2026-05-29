import 'server-only';

import axios from 'axios';
import type { ApiResponse, HousingSupplyResponseDto } from 'byzip-v2-sdk';

import { getApiBaseUrl } from '@/app/libs/utils/api';
import type {
  DetailPageData,
  DetailRow,
  DetailSourceSystem,
} from './detail.types';

const detailApi = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function inferSourceSystem(
  detail: HousingSupplyResponseDto,
): DetailSourceSystem {
  if (detail.pblancUrl?.includes('lh.or.kr')) {
    return 'LH';
  }

  return '청약홈';
}

function mapApiDetailToPageData(
  detail: HousingSupplyResponseDto,
): DetailPageData {
  return {
    ...detail,
    sourceSystem: inferSourceSystem(detail),
    detailRows: [],
  };
}

function createEmptyDetailPageData(identifier: string): DetailPageData {
  const parsedId = Number(identifier);
  const fallbackTimestamp = new Date(0);

  return {
    id: Number.isInteger(parsedId) && parsedId > 0 ? parsedId : 0,
    sourceSystem: 'UNKNOWN',
    detailRows: [] as DetailRow[],
    collectedAt: fallbackTimestamp,
    createdAt: fallbackTimestamp,
    updatedAt: fallbackTimestamp,
  } as DetailPageData;
}

function logDetailApiError(identifier: string, error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 'NETWORK';
    process.stderr.write(
      `[Detail API Error] GET /housing-supplies/${identifier} status=${status} message=${error.message}\n`,
    );
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `[Detail API Error] GET /housing-supplies/${identifier} message=${message}\n`,
  );
}

async function fetchHousingSupplyById(id: string) {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return createEmptyDetailPageData(id);
  }

  try {
    const response = await detailApi.get<ApiResponse<HousingSupplyResponseDto>>(
      `/housing-supplies/${parsedId}`,
    );

    if (response.status !== 200 || !response.data.success) {
      return createEmptyDetailPageData(id);
    }

    return mapApiDetailToPageData(response.data.data);
  } catch (error) {
    if (axios.isAxiosError(error) || error instanceof Error) {
      logDetailApiError(id, error);
      return createEmptyDetailPageData(id);
    }

    throw error;
  }
}

export async function getHousingSupplyDetail(identifier: string) {
  return fetchHousingSupplyById(identifier);
}
