import { HousingSupplyResponseDto } from 'byzip-v2-sdk';

export type DetailSourceSystem = '청약홈' | 'LH' | 'UNKNOWN';

export interface DetailRow {
  houseManageNo?: string;
  modelNo?: string | number | null;
  houseTy?: string | null;
  excluseAr?: string | number | null;
  suplyAr?: string | number | null;
  suplyHshldco?: string | number | null;
  spsplyHshldco?: string | number | null;
  lttotTopAmount?: string | number | null;
  suplyAmount?: string | number | null;
  mnychHshldco?: string | number | null;
  nwwdsHshldco?: string | number | null;
  lfeFrstHshldco?: string | number | null;
  oldParntsSuportHshldco?: string | number | null;
  insttRecomendHshldco?: string | number | null;
  etcHshldco?: string | number | null;
  transrInsttEnfsnHshldco?: string | number | null;
}

export interface DetailPageData extends HousingSupplyResponseDto {
  sourceSystem: DetailSourceSystem;
  detailRows: DetailRow[];
  gnrlRnk1CrspareaRceptPd?: string;
  gnrlRnk1EtcGgRcptdePd?: string;
  gnrlRnk1EtcAreaRcptdePd?: string;
  gnrlRnk2CrspareaRceptPd?: string;
  gnrlRnk2EtcGgRcptdePd?: string;
  gnrlRnk2EtcAreaRcptdePd?: string;
  lhNoticeText?: string;
}

export interface AptRealPriceItem {
  dealYear?: string | number;
  dealMonth?: string | number;
  dealDay?: string | number;
  aptNm?: string;
  floor?: string | number;
  umdNm?: string;
  excluUseAr?: string | number;
  dealAmount?: string;
}

export interface AptRealPriceResponse {
  success: boolean;
  message: string;
  lawdCd?: string;
  contractMonth?: string;
  items: AptRealPriceItem[];
}
