import 'server-only';

import axios from 'axios';
import type {
  ApiResponse,
  HousingSupplyDetailResponseDto,
  HousingSupplyResponseDto,
} from 'byzip-v2-sdk';

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

function formatDateText(value?: Date | string) {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? ''
      : value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function formatDateRangeText(start?: Date | string, end?: Date | string) {
  const startText = formatDateText(start);
  const endText = formatDateText(end);

  if (startText && endText) {
    return `${startText}~${endText}`;
  }

  return startText || endText || undefined;
}

function mapDetailRows(
  details: HousingSupplyDetailResponseDto[] | undefined,
): DetailRow[] {
  if (!Array.isArray(details)) {
    return [];
  }

  return details.map((item) => ({
    modelNo: item.modelNo,
    houseTy: item.houseType,
    excluseAr: item.area,
    suplyAr: item.area,
    suplyHshldco: item.suplyHshldco,
    spsplyHshldco: item.spSplyHshldco,
    suplyAmount: item.supplyAmount,
    mnychHshldco: item.mnYchHshldco,
    nwwdsHshldco: item.nwWdsHshldco,
    lfeFrstHshldco: item.lfeFrstHshldco,
    oldParntsSuportHshldco: item.oldParntsSuportHshldco,
    insttRecomendHshldco: item.insttRecomendHshldco,
    nwBbHshldco: item.nwBbHshldco,
    ygmnHshldco: item.ygmnHshldco,
    transrInsttEnfsnHshldco: item.transrInsttEnfsnHshldco,
    etcHshldco: item.etcHshldco,
  }));
}

function mapApiDetailToPageData(
  detail: HousingSupplyResponseDto,
): DetailPageData {
  return {
    ...detail,
    sourceSystem: inferSourceSystem(detail),
    detailRows: mapDetailRows(detail.details),
    gnrlRnk1CrspareaRceptPd: formatDateRangeText(
      detail.gnrlRnk1CrspareaRcptde,
      detail.gnrlRnk1CrspareaEndde,
    ),
    gnrlRnk1EtcGgRcptdePd: formatDateRangeText(
      detail.gnrlRnk1EtcGgRcptde,
      detail.gnrlRnk1EtcGgEndde,
    ),
    gnrlRnk1EtcAreaRcptdePd: formatDateRangeText(
      detail.gnrlRnk1EtcAreaRcptde,
      detail.gnrlRnk1EtcAreaEndde,
    ),
    gnrlRnk2CrspareaRceptPd: formatDateRangeText(
      detail.gnrlRnk2CrspareaRcptde,
      detail.gnrlRnk2CrspareaEndde,
    ),
    gnrlRnk2EtcGgRcptdePd: formatDateRangeText(
      detail.gnrlRnk2EtcGgRcptde,
      detail.gnrlRnk2EtcGgEndde,
    ),
    gnrlRnk2EtcAreaRcptdePd: formatDateRangeText(
      detail.gnrlRnk2EtcAreaRcptde,
      detail.gnrlRnk2EtcAreaEndde,
    ),
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
