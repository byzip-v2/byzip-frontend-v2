'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import styles from './detail.module.scss';
import type { DetailPageData, DetailRow } from './detail.types';

const DETAIL_BOOKMARK_STORAGE_KEY = 'byzip:detail-bookmarks';

interface DetailPageClientProps {
  detail: DetailPageData;
  detailId: string;
  isRealPriceEnabled: boolean;
}

interface LegacyIconProps {
  className?: string;
  size?: number;
}

interface DetailBookmarkItem {
  detailId: string;
  apiId: number;
  houseName: string;
  address: string;
  sourceSystem: DetailPageData['sourceSystem'];
  savedAt: string;
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

function displayText(value?: string | number | null) {
  if (!hasValue(value)) {
    return '';
  }

  return String(value).trim();
}

function formatRawDate(value?: string | Date | null) {
  if (!hasValue(value)) {
    return '';
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const normalized = String(value).trim();

  if (/^\d{8}$/.test(normalized)) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(normalized)) {
    return normalized.slice(0, 10);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  return normalized;
}

function formatDateRange(
  start?: string | Date | null,
  end?: string | Date | null,
) {
  const startText = formatRawDate(start);
  const endText = formatRawDate(end);

  if (startText && endText) {
    return `${startText}~${endText}`;
  }

  return startText || endText || '';
}

function formatPhoneNumber(value?: string | null) {
  if (!hasValue(value)) {
    return '';
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
    return '';
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

function parseNumericValue(value?: string | number | null) {
  if (!hasValue(value)) {
    return null;
  }

  const parsed = Number(String(value).replace(/,/g, ''));

  return Number.isFinite(parsed) ? parsed : null;
}

function formatArea(value?: string | number | null) {
  if (!hasValue(value)) {
    return '';
  }

  return `${value}㎡`;
}

function toPyeong(value?: string | number | null) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return null;
  }

  return Math.round(parsed / 3.3);
}

function formatPrice(value?: string | number | null) {
  if (!hasValue(value)) {
    return '';
  }

  const raw = String(value).trim();
  return raw.endsWith('만원') ? raw : `${raw}만원`;
}

function sumCounts(...values: Array<string | number | null | undefined>) {
  const parsedValues = values
    .map((value) => parseNumericValue(value))
    .filter((value): value is number => value !== null);

  if (!parsedValues.length) {
    return '';
  }

  return String(parsedValues.reduce((total, current) => total + current, 0));
}

function getHeaderTags(detail: DetailPageData) {
  if (detail.houseDtlSecdNm && detail.houseDtlSecdNm === detail.houseSecdNm) {
    return [detail.houseDtlSecdNm, detail.subscrptAreaCodeNm].filter(Boolean);
  }

  return [
    detail.houseDtlSecdNm,
    detail.houseSecdNm,
    detail.subscrptAreaCodeNm,
  ].filter(Boolean);
}

function readBookmarksFromStorage() {
  if (typeof window === 'undefined') {
    return [] as DetailBookmarkItem[];
  }

  try {
    const raw = window.localStorage.getItem(DETAIL_BOOKMARK_STORAGE_KEY);

    if (!raw) {
      return [] as DetailBookmarkItem[];
    }

    const parsed = JSON.parse(raw) as DetailBookmarkItem[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as DetailBookmarkItem[];
  }
}

function writeBookmarksToStorage(bookmarks: DetailBookmarkItem[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    DETAIL_BOOKMARK_STORAGE_KEY,
    JSON.stringify(bookmarks),
  );
}

function buildBookmarkItem(detailId: string, detail: DetailPageData): DetailBookmarkItem {
  return {
    detailId,
    apiId: detail.id,
    houseName: detail.houseName || '',
    address: detail.hssplyAdres || '',
    sourceSystem: detail.sourceSystem,
    savedAt: new Date().toISOString(),
  };
}

function logBookmarkList(action: 'added' | 'removed', bookmarks: DetailBookmarkItem[]) {
  console.log(`[Detail Bookmark] ${action}`, bookmarks);
}

function DetailHeader({
  detail,
  detailId,
  isBookmarked,
  onToggleBookmark,
}: {
  detail: DetailPageData;
  detailId: string;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  const router = useRouter();
  const headerTags = getHeaderTags(detail);
  const bookmarkLabel = isBookmarked ? '북마크 해제하기' : '북마크 추가하기';

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
        <button
          type="button"
          className={`${styles.bookmarkButton} ${
            isBookmarked ? styles.bookmarkButtonActive : ''
          }`}
          aria-label={bookmarkLabel}
          data-detail-id={detailId}
          onClick={onToggleBookmark}
        >
          {isBookmarked ? (
            <LegacyStarFilledIcon className={styles.bookmarkActiveIcon} size={16} />
          ) : (
            <LegacyStarOutlineIcon />
          )}
          <span>{bookmarkLabel}</span>
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
          className={`${styles.bookmarkButtonMobile} ${
            isBookmarked ? styles.bookmarkButtonActive : ''
          }`}
          aria-label={bookmarkLabel}
          data-detail-id={detailId}
          onClick={onToggleBookmark}
        >
          {isBookmarked ? (
            <LegacyStarFilledIcon className={styles.bookmarkActiveIcon} size={14} />
          ) : (
            <LegacyStarOutlineIcon size={14} />
          )}
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

        <h1 className={styles.headerTitle}>{detail.houseName || '상세페이지'}</h1>
        <p className={styles.headerAddress}>{displayText(detail.hssplyAdres)}</p>
        <div className={styles.headerInterestBadge}>
          <LegacyStarFilledIcon className={styles.headerInterestIcon} />
          <span>0명이 관심을 갖고 있어요</span>
        </div>
      </div>
    </header>
  );
}

const EMPTY_ROW: DetailRow = {};

function TableCell({
  children,
  align = 'left',
  colSpan,
  className,
}: {
  children: React.ReactNode;
  align?: 'left' | 'center';
  colSpan?: number;
  className?: string;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`${align === 'center' ? styles.tableCellCenter : styles.tableCell} ${
        className ?? ''
      }`.trim()}
    >
      {children}
    </td>
  );
}

function KeyInfoSection({ detail }: { detail: DetailPageData }) {
  const contactNumber = formatPhoneNumber(detail.mdhsTelno);

  return (
    <section>
      <h2 className={styles.sectionTitle}>입주자모집공고 주요정보</h2>
      <div className={styles.tableScroll}>
        <table className={styles.articleTable}>
          <tbody>
            <tr>
              <td className={styles.articleTitle} colSpan={4}>
                {displayText(detail.houseName)}
              </td>
            </tr>
            <tr>
              <td className={styles.tableHead}>공급위치</td>
              <TableCell>{displayText(detail.hssplyAdres)}</TableCell>
            </tr>
            <tr>
              <td className={styles.tableHead}>공급규모</td>
              <TableCell>{formatHouseholdCount(detail.totSuplyHshldco)}</TableCell>
            </tr>
            <tr>
              <td className={styles.tableHead}>관련문의</td>
              <TableCell>사업주체 또는 분양사무실로 문의</TableCell>
            </tr>
            <tr>
              <td className={styles.tableHead}>문의처</td>
              <TableCell>{contactNumber ? `☎ ${contactNumber}` : ''}</TableCell>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.linkRow}>
        {detail.pblancUrl ? (
          <a
            href={detail.pblancUrl}
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

function SubscriptionScheduleSection({ detail }: { detail: DetailPageData }) {
  const hideDetailedSchedule = ['02', '03', '04', '06'].includes(detail.houseSecd || '');

  return (
    <section>
      <h2 className={styles.sectionTitle}>청약일정</h2>
      <div className={styles.tableScroll}>
        <table className={styles.articleTable}>
          <tbody>
            <tr>
              <td className={styles.tableHead}>모집공고일</td>
              <TableCell colSpan={4}>{formatRawDate(detail.rcritPblancDe)}</TableCell>
            </tr>

            {!hideDetailedSchedule ? (
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
                    {formatDateRange(detail.spsplyRceptBgnde, detail.spsplyRceptEndde)}
                  </TableCell>
                </tr>
                <tr>
                  <TableCell align="center">1순위</TableCell>
                  <TableCell align="center">
                    {displayText(detail.gnrlRnk1CrspareaRceptPd)}
                  </TableCell>
                  <TableCell align="center">
                    {displayText(detail.gnrlRnk1EtcGgRcptdePd)}
                  </TableCell>
                  <TableCell align="center">
                    {displayText(detail.gnrlRnk1EtcAreaRcptdePd)}
                  </TableCell>
                </tr>
                <tr>
                  <TableCell align="center">2순위</TableCell>
                  <TableCell align="center">
                    {displayText(detail.gnrlRnk2CrspareaRceptPd)}
                  </TableCell>
                  <TableCell align="center">
                    {displayText(detail.gnrlRnk2EtcGgRcptdePd)}
                  </TableCell>
                  <TableCell align="center">
                    {displayText(detail.gnrlRnk2EtcAreaRcptdePd)}
                  </TableCell>
                </tr>
              </>
            ) : null}

            <tr>
              <td className={styles.tableHead}>당첨자 발표일</td>
              <TableCell colSpan={4}>{formatRawDate(detail.przwnerPresnatnDe)}</TableCell>
            </tr>
            <tr>
              <td className={styles.tableHead}>계약일</td>
              <TableCell colSpan={4}>
                {formatDateRange(detail.cntrctCnclsBgnde, detail.cntrctCnclsEndde)}
              </TableCell>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SupplyInfoSection({ detail }: { detail: DetailPageData }) {
  const rows = detail.detailRows.length ? detail.detailRows : [EMPTY_ROW];

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
            {rows.map((row, index) => {
              const exclusiveArea = displayText(row.houseTy) || formatArea(row.excluseAr);
              const supplyAreaValue = hasValue(row.suplyAr) ? row.suplyAr : row.excluseAr;
              const supplyArea = formatArea(supplyAreaValue);
              const pyeong = toPyeong(supplyAreaValue);

              return (
                <tr key={`${displayText(row.modelNo) || 'empty'}-${index}`}>
                  <td className={styles.tableHeadCompact}>{displayText(row.modelNo)}</td>
                  <TableCell align="center">{exclusiveArea}</TableCell>
                  <TableCell align="center">
                    <div>{supplyArea}</div>
                    {pyeong !== null && supplyArea ? (
                      <div className={styles.subText}>({pyeong}평)</div>
                    ) : null}
                  </TableCell>
                  <TableCell align="center">{displayText(row.suplyHshldco)}</TableCell>
                  <TableCell align="center">{displayText(row.spsplyHshldco)}</TableCell>
                  <TableCell align="center">
                    {sumCounts(row.suplyHshldco, row.spsplyHshldco)}
                  </TableCell>
                  <TableCell align="center">
                    {formatPrice(row.lttotTopAmount ?? row.suplyAmount)}
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

function SpecialSupplySection({ detail }: { detail: DetailPageData }) {
  if (['06', '04', '03', '02'].includes(detail.houseSecd || '')) {
    return null;
  }

  const rows = detail.detailRows.length ? detail.detailRows : [EMPTY_ROW];

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

            {rows.map((row, index) => (
              <tr key={`${displayText(row.modelNo) || 'special'}-${index}`}>
                <TableCell align="center">
                  {displayText(row.houseTy) || formatArea(row.excluseAr)}
                </TableCell>
                <TableCell align="center">{displayText(row.mnychHshldco)}</TableCell>
                <TableCell align="center">{displayText(row.nwwdsHshldco)}</TableCell>
                <TableCell align="center">{displayText(row.lfeFrstHshldco)}</TableCell>
                <TableCell align="center">{displayText(row.oldParntsSuportHshldco)}</TableCell>
                <TableCell align="center">{displayText(row.insttRecomendHshldco)}</TableCell>
                <TableCell align="center">{displayText(row.etcHshldco)}</TableCell>
                <TableCell align="center">{displayText(row.transrInsttEnfsnHshldco)}</TableCell>
                <TableCell align="center">{displayText(row.spsplyHshldco)}</TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.sectionInfo}>
        *공급세대수는 사업주체의 최초 입주자모집 공고문 기준입니다. 특별공급 신청 미달 시 잔여물량은
        일반공급으로 전환됨에 따라 일반공급 세대 수가 변경될 수 있으므로 최종 일반공급 세대수는 일반공급
        신청일에 청약접수 경쟁률에서 확인 또는 사업주체에 문의하시기 바랍니다.
      </p>
    </section>
  );
}

function ExtraInfoSection({ detail }: { detail: DetailPageData }) {
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
              <TableCell align="center">{displayText(detail.bsnsMbyNm)}</TableCell>
              <TableCell align="center">{displayText(detail.cnstrctEntrpsNm)}</TableCell>
              <TableCell align="center">{formatPhoneNumber(detail.mdhsTelno)}</TableCell>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LhDetailSection({ detail }: { detail: DetailPageData }) {
  return (
    <>
      <section>
        <h2 className={styles.sectionTitle}>공급일정</h2>
        <div className={styles.tableScroll}>
          <table className={styles.articleTable}>
            <tbody>
              <tr>
                <td className={styles.tableHeadLh}>모집공고일</td>
                <TableCell align="center" className={styles.tableCellLh}>
                  {formatRawDate(detail.rcritPblancDe)}
                </TableCell>
              </tr>
              <tr>
                <td className={styles.tableHeadLh}>서류 접수 기간</td>
                <TableCell align="center" className={styles.tableCellLh}>
                  {formatDateRange(detail.rceptBgnde, detail.rceptEndde)}
                </TableCell>
              </tr>
              <tr>
                <td className={styles.tableHeadLh}>당첨자 발표일</td>
                <TableCell align="center" className={styles.tableCellLh}>
                  {formatRawDate(detail.przwnerPresnatnDe)}
                </TableCell>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>유의사항</h2>
        <div className={styles.tableScroll}>
          <table className={styles.articleTable}>
            <tbody>
              <tr>
                <td className={styles.tableHeadLh}>유의사항</td>
                <TableCell className={styles.tableCellLhNotice}>
                  {displayText(detail.lhNoticeText)}
                </TableCell>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
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
          현재 상세 API 응답에는 실거래가 연동용 후처리가 아직 없어, 탭 UI만 유지하고 실제 데이터 연동은 추후
          연결하도록 분리해뒀습니다.
        </p>
      </div>
    </section>
  );
}

export default function DetailPageClient({
  detail,
  detailId,
  isRealPriceEnabled,
}: DetailPageClientProps) {
  const [isRealPriceTab, setIsRealPriceTab] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const isLhDetail = detail.sourceSystem === 'LH';

  useEffect(() => {
    const bookmarks = readBookmarksFromStorage();
    setIsBookmarked(bookmarks.some((item) => item.detailId === detailId));
  }, [detailId]);

  const handleToggleBookmark = () => {
    const bookmarks = readBookmarksFromStorage();
    const exists = bookmarks.some((item) => item.detailId === detailId);

    if (exists) {
      const nextBookmarks = bookmarks.filter((item) => item.detailId !== detailId);
      writeBookmarksToStorage(nextBookmarks);
      setIsBookmarked(false);
      logBookmarkList('removed', nextBookmarks);
      return;
    }

    const nextBookmarks = [...bookmarks, buildBookmarkItem(detailId, detail)];
    writeBookmarksToStorage(nextBookmarks);
    setIsBookmarked(true);
    logBookmarkList('added', nextBookmarks);
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <DetailHeader
          detail={detail}
          detailId={detailId}
          isBookmarked={isBookmarked}
          onToggleBookmark={handleToggleBookmark}
        />

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
          <section className={styles.contentSection}>
            <KeyInfoSection detail={detail} />
            {isLhDetail ? (
              <LhDetailSection detail={detail} />
            ) : (
              <>
                <SubscriptionScheduleSection detail={detail} />
                <SupplyInfoSection detail={detail} />
                <SpecialSupplySection detail={detail} />
                <ExtraInfoSection detail={detail} />
              </>
            )}
          </section>
        ) : (
          <RealPricePanel isRealPriceEnabled={isRealPriceEnabled} />
        )}
      </div>
    </div>
  );
}
