export interface LegacyRegister {
  CTRT_PLC_ADR?: string;
  CTRT_PLC_DTL_ADR?: string;
  TSK_ST_DTTM?: string;
  TSK_ED_DTTM?: string;
  SIL_OFC_TLNO?: string;
  SIL_OFC_GUD_FCTS?: string;
}

export interface LegacySchedule {
  SBSC_ACP_ST_DT?: string;
  SBSC_ACP_CLSG_DT?: string;
  PPR_ACP_ST_DT?: string;
  PPR_ACP_CLSG_DT?: string;
  PPR_SBM_OPE_ANC_DT?: string;
  PZWR_ANC_DT?: string;
  CTRT_ST_DT?: string;
  CTRT_ED_DT?: string;
  SBD_LGO_NM?: string;
}

export interface LegacyFile {
  AHFL_URL?: string;
  CMN_AHFL_NM?: string;
  SL_PAN_AHFL_DS_CD_NM?: string;
}

export interface LegacyLhComplexDetail {
  LGDN_ADR?: string;
  LGDN_DTL_ADR?: string;
  LCC_NT_NM?: string;
  MVIN_XPC_YM?: string;
  HSH_CNT?: string;
  DDO_AR?: string;
  HTN_FMLA_DESC?: string;
  SPL_INF_GUD_FCTS?: string;
}

export interface LegacyDetailRow {
  SUPLY_AR?: string | number | null;
  HOUSE_MANAGE_NO?: string;
  SPSPLY_HSHLDCO?: string | number | null;
  MODEL_NO?: string | null;
  MNYCH_HSHLDCO?: string | number | null;
  LTTOT_TOP_AMOUNT?: string | number | null;
  HOUSE_TY?: string | null;
  SUPLY_HSHLDCO?: string | number | null;
  YGMN_HSHLDCO?: string | number | null;
  PBLANC_NO?: string;
  NWWDS_HSHLDCO?: string | number | null;
  OLD_PARNTS_SUPORT_HSHLDCO?: string | number | null;
  TRANSR_INSTT_ENFSN_HSHLDCO?: string | number | null;
  ETC_HSHLDCO?: string | number | null;
  LFE_FRST_HSHLDCO?: string | number | null;
  INSTT_RECOMEND_HSHLDCO?: string | number | null;
  TOT_SUPLY_HSHLDCO?: string | number | null;
  NWBB_HSHLDCO?: string | number | null;
  EXCLUSE_AR?: string | number | null;
  SUPLY_AMOUNT?: string | number | null;
  REGISTER?: LegacyRegister[];
  FILE?: LegacyFile[];
  SCHEDULE?: LegacySchedule[];
  DETAIL?: LegacyLhComplexDetail[];
}

export interface LegacyCoordinates {
  x?: string;
  y?: string;
}

export interface LegacyHomeData {
  API?: string;
  PBLANC_NO?: string;
  HOUSE_NM?: string;
  HOUSE_SECD?: string;
  HOUSE_SECD_NM?: string;
  HOUSE_DTL_SECD?: string;
  HOUSE_DTL_SECD_NM?: string;
  SUBSCRPT_AREA_CODE?: string;
  SUBSCRPT_AREA_CODE_NM?: string;
  HSSPLY_ADRES?: string;
  FOR_COORDINATES_ADRES?: string;
  TOT_SUPLY_HSHLDCO?: string | number;
  SUPLY_HSHLDCO?: string | number;
  SPSPLY_HSHLDCO?: string | number;
  RCRIT_PBLANC_DE?: string;
  SPSPLY_RCEPT_BGNDE?: string;
  SPSPLY_RCEPT_ENDDE?: string;
  GNRL_RNK1_CRSPAREA_RCEPT_PD?: string;
  GNRL_RNK1_ETC_GG_RCPTDE_PD?: string;
  GNRL_RNK1_ETC_AREA_RCPTDE_PD?: string;
  GNRL_RNK2_CRSPAREA_RCEPT_PD?: string;
  GNRL_RNK2_ETC_GG_RCPTDE_PD?: string;
  GNRL_RNK2_ETC_AREA_RCPTDE_PD?: string;
  RCEPT_BGNDE?: string;
  RCEPT_ENDDE?: string;
  PRZWNER_PRESNATN_DE?: string;
  CNTRCT_CNCLS_BGNDE?: string;
  CNTRCT_CNCLS_ENDDE?: string;
  MVN_PREARNGE_YM?: string;
  MDHS_TELNO?: string;
  CNSTRCT_ENTRPS_NM?: string;
  BSNS_MBY_NM?: string;
  HMPG_ADRES?: string;
  PBLANC_URL?: string;
  AHFL_URL?: string;
  SPECLT_RDN_EARTH_AT?: string;
  MDAT_TRGET_AREA_SECD?: string;
  DETAIL?: LegacyDetailRow[];
  COORDINATES?: LegacyCoordinates;
}

export interface LegacyIndexResponse {
  pageProps?: {
    homeList?: {
      allHomeData?: LegacyHomeData[];
    };
  };
}
