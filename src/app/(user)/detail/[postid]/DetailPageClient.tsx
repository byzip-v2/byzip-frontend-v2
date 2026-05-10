'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import styles from './detail.module.scss';
import type { LegacyDetailRow, LegacyHomeData } from './types';

interface DetailPageClientProps {
  detail: LegacyHomeData;
  isRealPriceEnabled: boolean;
}

interface LegacyIconProps {
  className?: string;
  size?: number;
}

function LegacyBackIcon({ className, size = 24 }: LegacyIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="currentColor"
      focusable="false"
    >
      <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 0 0 0 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z" />
    </svg>
  );
}

function LegacyStarOutlineIcon({ className, size = 16 }: LegacyIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="currentColor"
      focusable="false"
    >
      <path d="M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3a32.05 32.05 0 0 0 .6 45.3l183.7 179.1-43.4 252.9a31.95 31.95 0 0 0 46.4 33.7L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3zM664.8 561.6l36.1 210.3L512 672.7 323.1 772l36.1-210.3-152.8-149L417.6 382 512 190.7 606.4 382l211.2 30.7-152.8 148.9z" />
    </svg>
  );
}

function LegacyStarFilledIcon({ className, size = 18 }: LegacyIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="currentColor"
      focusable="false"
    >
      <path d="M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3a32.05 32.05 0 0 0 .6 45.3l183.7 179.1-43.4 252.9a31.95 31.95 0 0 0 46.4 33.7L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3z" />
    </svg>
  );
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
}

function formatRawDate(value?: string | null) {
  if (!hasValue(value)) {
    return '-';
  }

  const normalized = String(value).trim();

  if (/^\d{8}$/.test(normalized)) {
    return `${normalized.slice(0, 4)}.${normalized.slice(4, 6)}.${normalized.slice(6, 8)}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized.replace(/-/g, '.');
  }

  return normalized;
}

function formatDateRange(start?: string | null, end?: string | null) {
  if (!hasValue(start) && !hasValue(end)) {
    return '-';
  }

  if (hasValue(start) && hasValue(end)) {
    return `${formatRawDate(start)} ~ ${formatRawDate(end)}`;
  }

  return formatRawDate(start || end || '');
}

function formatPhoneNumber(value?: string | null) {
  if (!hasValue(value)) {
    return '-';
  }

  const digits = String(value).replace(/\D/g, '');

  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
  }

  if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5, 9)}`;
  }

  if (digits.length === 10) {
    if (digits.startsWith('02')) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }

  return String(value);
}

function formatHouseholdCount(value?: string | number | null) {
  if (!hasValue(value)) {
    return '-';
  }

  const raw = String(value).trim();

  if (/[가-힣]/.test(raw)) {
    return raw;
  }

  const parsed = Number(raw.replace(/,/g, ''));
  if (Number.isFinite(parsed)) {
    return `${parsed.toLocaleString('ko-KR')}세대`;
  }

  return raw;
}

function formatPrice(value?: string | number | null) {
  if (!hasValue(value)) {
    return '-';
  }

  const raw = String(value).trim();
  return raw.endsWith('만원') ? raw : `${raw}만원`;
}

function toPyeong(value?: string | number | null) {
  if (!hasValue(value)) {
    return null;
  }

  const parsed = Number(String(value).replace(/,/g, ''));

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed / 3.3);
}

function getHeaderTags(detail: LegacyHomeData) {
  if (detail.HOUSE_DTL_SECD_NM && detail.HOUSE_DTL_SECD_NM === detail.HOUSE_SECD_NM) {
    return [detail.HOUSE_DTL_SECD_NM, detail.SUBSCRPT_AREA_CODE_NM].filter(Boolean);
  }

  return [
    detail.HOUSE_DTL_SECD_NM,
    detail.HOUSE_SECD_NM,
    detail.SUBSCRPT_AREA_CODE_NM,
  ].filter(Boolean);
}

function DetailHeader({ detail }: { detail: LegacyHomeData }) {
  const router = useRouter();
  const headerTags = getHeaderTags(detail);

  return (
    <header className={styles.header}>
      <div className={styles.headerTopRow}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => router.back()}
          aria-label="뒤로가기"
        >
          <LegacyBackIcon />
        </button>
        <button type="button" className={styles.bookmarkButton} aria-label="북마크 추가하기">
          <LegacyStarOutlineIcon />
          <span>북마크 추가하기</span>
        </button>
      </div>

      <div className={styles.headerTopRowMobile}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => router.back()}
          aria-label="뒤로가기"
        >
          <LegacyBackIcon />
        </button>
        <button
          type="button"
          className={styles.bookmarkButtonMobile}
          aria-label="북마크 추가하기"
        >
          <LegacyStarOutlineIcon />
        </button>
      </div>

      <div className={styles.headerBody}>
        <div className={styles.headerTagRow}>
          {headerTags.map((tag, index) => (
            <span key={`${tag}-${index}`} className={styles.headerTagGroup}>
              <span className={styles.headerTag}>{tag}</span>
              {index < headerTags.length - 1 ? (
                <span className={styles.headerTagDivider} aria-hidden="true">
                  |
                </span>
              ) : null}
            </span>
          ))}
        </div>

        <h1 className={styles.headerTitle}>{detail.HOUSE_NM || '상세페이지'}</h1>
        <p className={styles.headerAddress}>
          {detail.FOR_COORDINATES_ADRES || detail.HSSPLY_ADRES || '-'}
        </p>
        <div className={styles.headerInterestBadge}>
          <LegacyStarFilledIcon className={styles.headerInterestIcon} />
          <span>0명이 관심을 갖고 있어요</span>
        </div>
      </div>
    </header>
  );
}

function TableCell({
  children,
  align = 'left',
  colSpan,
}: {
  children: React.ReactNode;
  align?: 'left' | 'center';
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={align === 'center' ? styles.tableCellCenter : styles.tableCell}
    >
      {children}
    </td>
  );
}

function KeyInfoSection({ detail }: { detail: LegacyHomeData }) {
  return (
    <section>
      <h2 className={styles.sectionTitle}>입주자모집공고 주요정보</h2>
      <div className={styles.tableScroll}>
        <table className={styles.articleTable}>
          <tbody>
            <tr>
              <td className={styles.articleTitle} colSpan={4}>
                {detail.HOUSE_NM || '-'}
              </td>
            </tr>
            <tr>
              <td className={styles.tableHead}>공급위치</td>
              <TableCell>{detail.HSSPLY_ADRES || '-'}</TableCell>
            </tr>
            <tr>
              <td className={styles.tableHead}>공급규모</td>
              <TableCell>{formatHouseholdCount(detail.TOT_SUPLY_HSHLDCO)}</TableCell>
            </tr>
            <tr>
              <td className={styles.tableHead}>관련문의</td>
              <TableCell>사업주체 또는 분양사무실로 문의</TableCell>
            </tr>
            <tr>
              <td className={styles.tableHead}>문의처</td>
              <TableCell>☎ {formatPhoneNumber(detail.MDHS_TELNO)}</TableCell>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.linkRow}>
        {detail.PBLANC_URL ? (
          <a
            href={detail.PBLANC_URL}
            target="_blank"
            rel="noreferrer"
            className={styles.primaryLinkButton}
          >
            모집공고문 보기
          </a>
        ) : null}
      </div>
    </section>
  );
}

function SubscriptionScheduleSection({ detail }: { detail: LegacyHomeData }) {
  const hideSpecialRows = ['02', '03', '04', '06'].includes(detail.HOUSE_SECD || '');

  return (
    <section>
      <h2 className={styles.sectionTitle}>청약일정</h2>
      <div className={styles.tableScroll}>
        <table className={styles.articleTable}>
          <tbody>
            <tr>
              <td className={styles.tableHead}>모집공고일</td>
              <TableCell>{formatRawDate(detail.RCRIT_PBLANC_DE)}</TableCell>
            </tr>

            {!hideSpecialRows ? (
              <>
                <tr>
                  <td className={styles.tableHead} rowSpan={4}>
                    청약접수
                  </td>
                  <td className={styles.tableHeadBlue}>구분</td>
                  <td className={styles.tableHeadBlue}>해당지역</td>
                  <td className={styles.tableHeadBlue}>기타경기</td>
                  <td className={styles.tableHeadBlue}>기타지역</td>
                </tr>
                <tr>
                  <TableCell align="center">특별공급</TableCell>
                  <TableCell align="center" colSpan={3}>
                    {formatDateRange(detail.SPSPLY_RCEPT_BGNDE, detail.SPSPLY_RCEPT_ENDDE)}
                  </TableCell>
                </tr>
                <tr>
                  <TableCell align="center">1순위</TableCell>
                  <TableCell align="center">{formatRawDate(detail.GNRL_RNK1_CRSPAREA_RCEPT_PD)}</TableCell>
                  <TableCell align="center">{formatRawDate(detail.GNRL_RNK1_ETC_GG_RCPTDE_PD)}</TableCell>
                  <TableCell align="center">{formatRawDate(detail.GNRL_RNK1_ETC_AREA_RCPTDE_PD)}</TableCell>
                </tr>
                <tr>
                  <TableCell align="center">2순위</TableCell>
                  <TableCell align="center">{formatRawDate(detail.GNRL_RNK2_CRSPAREA_RCEPT_PD)}</TableCell>
                  <TableCell align="center">{formatRawDate(detail.GNRL_RNK2_ETC_GG_RCPTDE_PD)}</TableCell>
                  <TableCell align="center">{formatRawDate(detail.GNRL_RNK2_ETC_AREA_RCPTDE_PD)}</TableCell>
                </tr>
              </>
            ) : (
              <tr>
                <td className={styles.tableHead}>청약접수</td>
                <TableCell>{formatDateRange(detail.RCEPT_BGNDE, detail.RCEPT_ENDDE)}</TableCell>
              </tr>
            )}

            <tr>
              <td className={styles.tableHead}>당첨자 발표일</td>
              <TableCell>{formatRawDate(detail.PRZWNER_PRESNATN_DE)}</TableCell>
            </tr>
            <tr>
              <td className={styles.tableHead}>계약일</td>
              <TableCell>
                {formatDateRange(detail.CNTRCT_CNCLS_BGNDE, detail.CNTRCT_CNCLS_ENDDE)}
              </TableCell>
            </tr>
          </tbody>
        </table>
      </div>
      <p className={styles.sectionInfo}>
        *특별공급 종류에 따라 접수기간 및 장소가 다를 수 있으니 모집공고를 반드시 확인하시기 바랍니다.
      </p>
    </section>
  );
}

function SupplyInfoSection({ detailRows }: { detailRows: LegacyDetailRow[] }) {
  if (!detailRows.length) {
    return null;
  }

  return (
    <section>
      <h2 className={styles.sectionTitle}>공급개요</h2>
      <div className={styles.tableScroll}>
        <table className={styles.articleTable}>
          <tbody>
            <tr>
              <td className={styles.tableHeadCompact} rowSpan={2}>
                번호
              </td>
              <td className={styles.tableHeadCompact} rowSpan={2}>
                주거전용면적
              </td>
              <td className={styles.tableHeadCompact} rowSpan={2}>
                공급면적
              </td>
              <td className={styles.tableHeadCompact} colSpan={3}>
                공급세대수
              </td>
              <td className={styles.tableHeadCompact}>공급금액</td>
            </tr>
            <tr>
              <td className={styles.tableHeadCompact}>일반</td>
              <td className={styles.tableHeadCompact}>특별</td>
              <td className={styles.tableHeadCompact}>총계</td>
              <td className={styles.tableHeadCompact}>(최고가 기준)</td>
            </tr>

            {detailRows.map((item, index) => {
              const exclusiveArea = item.HOUSE_TY || item.EXCLUSE_AR || '-';
              const supplyArea = item.SUPLY_AR || item.EXCLUSE_AR || '-';
              const generalCount = Number(item.SUPLY_HSHLDCO || 0);
              const specialCount = Number(item.SPSPLY_HSHLDCO || 0);
              const pyeong = toPyeong(item.SUPLY_AR || item.EXCLUSE_AR);

              return (
                <tr key={`${item.MODEL_NO || 'row'}-${index}`}>
                  <td className={styles.tableHeadCompact}>{item.MODEL_NO || index + 1}</td>
                  <TableCell align="center">{exclusiveArea || '-'}</TableCell>
                  <TableCell align="center">
                    <div>{hasValue(supplyArea) ? `${supplyArea}㎡` : '-'}</div>
                    {pyeong ? <div className={styles.subText}>({pyeong}평)</div> : null}
                  </TableCell>
                  <TableCell align="center">{generalCount}</TableCell>
                  <TableCell align="center">{specialCount}</TableCell>
                  <TableCell align="center">{generalCount + specialCount}</TableCell>
                  <TableCell align="center">
                    {formatPrice(item.LTTOT_TOP_AMOUNT || item.SUPLY_AMOUNT)}
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SpecialSupplySection({
  detail,
  detailRows,
}: {
  detail: LegacyHomeData;
  detailRows: LegacyDetailRow[];
}) {
  if (!detailRows.length) {
    return null;
  }

  if (['06', '04', '03', '02'].includes(detail.HOUSE_SECD || '')) {
    return null;
  }

  return (
    <section>
      <h2 className={styles.sectionTitle}>특별공급</h2>
      <div className={styles.tableScroll}>
        <table className={styles.articleTable}>
          <tbody>
            <tr>
              <td className={styles.tableHeadCompact} rowSpan={2}>
                주거전용면적
              </td>
              <td className={styles.tableHeadCompact} colSpan={8}>
                공급세대수
              </td>
            </tr>
            <tr>
              <td className={styles.tableHeadCompact}>다자녀</td>
              <td className={styles.tableHeadCompact}>신혼부부</td>
              <td className={styles.tableHeadCompact}>생애최초</td>
              <td className={styles.tableHeadCompact}>노부모</td>
              <td className={styles.tableHeadCompact}>기관추천</td>
              <td className={styles.tableHeadCompact}>기타</td>
              <td className={styles.tableHeadCompact}>이전기관</td>
              <td className={styles.tableHeadCompact}>총계</td>
            </tr>

            {detailRows.map((item, index) => (
              <tr key={`${item.MODEL_NO || 'special'}-${index}`}>
                <TableCell align="center">{item.HOUSE_TY || '-'}</TableCell>
                <TableCell align="center">{item.MNYCH_HSHLDCO || 0}</TableCell>
                <TableCell align="center">{item.NWWDS_HSHLDCO || 0}</TableCell>
                <TableCell align="center">{item.LFE_FRST_HSHLDCO || 0}</TableCell>
                <TableCell align="center">{item.OLD_PARNTS_SUPORT_HSHLDCO || 0}</TableCell>
                <TableCell align="center">{item.INSTT_RECOMEND_HSHLDCO || 0}</TableCell>
                <TableCell align="center">{item.ETC_HSHLDCO || 0}</TableCell>
                <TableCell align="center">{item.TRANSR_INSTT_ENFSN_HSHLDCO || 0}</TableCell>
                <TableCell align="center">{item.SPSPLY_HSHLDCO || 0}</TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.sectionInfo}>
        *공급세대수는 사업주체의 최초 입주자모집 공고문 기준입니다. 특별공급 신청 미달 시 잔여물량은 일반공급으로
        전환될 수 있으므로 최종 세대수는 모집공고문을 다시 확인하시기 바랍니다.
      </p>
    </section>
  );
}

function ExtraInfoSection({ detail }: { detail: LegacyHomeData }) {
  return (
    <section>
      <h2 className={styles.sectionTitle}>기타사항</h2>
      <div className={styles.tableScroll}>
        <table className={styles.articleTable}>
          <tbody>
            <tr>
              <td className={styles.tableHeadCompact}>시행사</td>
              <td className={styles.tableHeadCompact}>시공사</td>
              <td className={styles.tableHeadCompact}>사업주체 전화번호</td>
            </tr>
            <tr>
              <TableCell align="center">{detail.BSNS_MBY_NM || '-'}</TableCell>
              <TableCell align="center">{detail.CNSTRCT_ENTRPS_NM || '-'}</TableCell>
              <TableCell align="center">{formatPhoneNumber(detail.MDHS_TELNO)}</TableCell>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LhDetailSection({ detail }: { detail: LegacyHomeData }) {
  const lhDetail = detail.DETAIL?.[0];
  const register = lhDetail?.REGISTER?.[0];
  const fileList = lhDetail?.FILE ?? [];
  const complexList = lhDetail?.DETAIL ?? [];

  return (
    <>
      <section>
        <h2 className={styles.sectionTitle}>공급일정</h2>
        <div className={styles.tableScroll}>
          <table className={styles.articleTable}>
            <tbody>
              <tr>
                <td className={styles.tableHead}>모집공고일</td>
                <TableCell>{formatRawDate(detail.RCRIT_PBLANC_DE)}</TableCell>
              </tr>
              <tr>
                <td className={styles.tableHead}>서류 접수 기간</td>
                <TableCell>{formatDateRange(detail.RCEPT_BGNDE, detail.RCEPT_ENDDE)}</TableCell>
              </tr>
              <tr>
                <td className={styles.tableHead}>당첨자 발표일</td>
                <TableCell>{formatRawDate(detail.PRZWNER_PRESNATN_DE)}</TableCell>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {complexList.length ? (
        <section>
          <h2 className={styles.sectionTitle}>공급단지 정보</h2>
          <div className={styles.tableScroll}>
            <table className={styles.articleTable}>
              <tbody>
                <tr>
                  <td className={styles.tableHeadCompact}>단지명</td>
                  <td className={styles.tableHeadCompact}>공급위치</td>
                  <td className={styles.tableHeadCompact}>세대수</td>
                  <td className={styles.tableHeadCompact}>면적</td>
                  <td className={styles.tableHeadCompact}>입주예정</td>
                </tr>
                {complexList.map((item, index) => (
                  <tr key={`${item.LCC_NT_NM || 'lh'}-${index}`}>
                    <TableCell align="center">{item.LCC_NT_NM || '-'}</TableCell>
                    <TableCell>{item.LGDN_ADR || '-'}</TableCell>
                    <TableCell align="center">
                      {hasValue(item.HSH_CNT) ? `${item.HSH_CNT}세대` : '-'}
                    </TableCell>
                    <TableCell align="center">{item.DDO_AR || '-'}</TableCell>
                    <TableCell align="center">{item.MVIN_XPC_YM || '-'}</TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {register?.SIL_OFC_GUD_FCTS ? (
        <section>
          <h2 className={styles.sectionTitle}>유의사항</h2>
          <div className={styles.noticeBox}>{register.SIL_OFC_GUD_FCTS}</div>
        </section>
      ) : null}

      {fileList.length ? (
        <section>
          <h2 className={styles.sectionTitle}>첨부파일</h2>
          <div className={styles.fileList}>
            {fileList.map((file, index) =>
              file.AHFL_URL ? (
                <a
                  key={`${file.AHFL_URL}-${index}`}
                  href={file.AHFL_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.fileButton}
                >
                  <span>{file.SL_PAN_AHFL_DS_CD_NM || '첨부파일'}</span>
                  <span className={styles.fileName}>{file.CMN_AHFL_NM || '열기'}</span>
                </a>
              ) : null,
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}

function RealPricePanel({ isRealPriceEnabled }: { isRealPriceEnabled: boolean }) {
  return (
    <section className={styles.contentSection}>
      <div className={styles.realPricePlaceholder}>
        <h2 className={styles.sectionTitle}>주변 아파트 매매 실거래가</h2>
        <p className={styles.realPriceText}>
          {isRealPriceEnabled
            ? '실거래가 연동 구조는 준비되어 있지만 현재 상세 페이지에는 아직 연결되지 않았습니다.'
            : '현재 v2 환경에는 실거래가 API 키가 없어 탭 UI만 우선 복원했습니다.'}
        </p>
        <p className={styles.sectionInfo}>
          기존 분양모음집의 탭 구조는 유지하되, 외부 API 연동은 v2 환경 정리 후 붙이는 편이 안전합니다.
        </p>
      </div>
    </section>
  );
}

export default function DetailPageClient({
  detail,
  isRealPriceEnabled,
}: DetailPageClientProps) {
  const [isRealPriceTab, setIsRealPriceTab] = useState(false);
  const isLhDetail = detail.API === 'LH';
  const detailRows = isLhDetail ? [] : detail.DETAIL ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <DetailHeader detail={detail} />

        <div className={styles.tabRow}>
          <button
            type="button"
            className={`${styles.tabButton} ${!isRealPriceTab ? styles.tabButtonActive : ''}`}
            onClick={() => setIsRealPriceTab(false)}
          >
            분양 상세 정보
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${isRealPriceTab ? styles.tabButtonActive : ''}`}
            onClick={() => setIsRealPriceTab(true)}
          >
            <span>주변 아파트 매매</span>
            <span>실거래가</span>
          </button>
        </div>

        {!isRealPriceTab ? (
          <>
            <section className={styles.contentSection}>
              <KeyInfoSection detail={detail} />
              {isLhDetail ? (
                <LhDetailSection detail={detail} />
              ) : (
                <>
                  <SubscriptionScheduleSection detail={detail} />
                  <SupplyInfoSection detailRows={detailRows} />
                  <SpecialSupplySection detail={detail} detailRows={detailRows} />
                  <ExtraInfoSection detail={detail} />
                </>
              )}
            </section>
          </>
        ) : (
          <RealPricePanel isRealPriceEnabled={isRealPriceEnabled} />
        )}
      </div>
    </div>
  );
}
