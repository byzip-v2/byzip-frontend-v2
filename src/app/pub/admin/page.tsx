'use client';

import AdminPageHeader from '@/app/pub/admin/AdminPageHeader';
import styles from '@/styles/pages/admin/dashboard.module.scss';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type BugReport = {
  id: string;
  summary: string;
};

type MissingGeoRow = {
  id: string;
  announcement: string;
  postedAt: string;
  winnerAt: string;
};

type OsShare = {
  label: string;
  value: number;
  color: string;
};

const DASHBOARD_STATS = [
  { label: '모집중인 공고', value: 14, tone: 'pending' as const },
  { label: '오늘 올라온 공고', value: 4, tone: 'new' as const },
];

const VISITOR_DAILY = [
  41, 56, 28, 31, 36, 39, 57, 55, 64, 43, 71, 78, 80, 84, 62, 66, 69, 52, 58,
  61, 65, 68, 73, 70, 76, 79, 82, 85, 88, 92,
];

const VISITOR_HOURLY = [
  8, 6, 5, 4, 3, 4, 7, 10, 14, 17, 20, 22, 24, 23, 21, 20, 19, 18, 16, 14, 12,
  10, 9, 8,
];

const BUG_REPORTS: BugReport[] = [
  {
    id: 'bug-1',
    summary:
      'The server encountered an internal error or misconfiguration and was unable to complete your request.',
  },
  {
    id: 'bug-2',
    summary:
      'The server encountered an internal error while rendering the dashboard widget on production.',
  },
  {
    id: 'bug-3',
    summary:
      'The server encountered an internal error because required environment variables were not loaded.',
  },
  {
    id: 'bug-4',
    summary:
      'The server encountered an internal error after deployment due to cache synchronization lag.',
  },
  {
    id: 'bug-5',
    summary:
      'The server encountered an internal error while processing API requests in peak traffic.',
  },
];

const MISSING_GEO_ROWS: MissingGeoRow[] = [
  {
    id: 'row-1',
    announcement: '군산소룡신도시',
    postedAt: '02/08/2023',
    winnerAt: '03/05/2023',
  },
  {
    id: 'row-2',
    announcement: '군산신역세권 A-3블록 영구임대주택',
    postedAt: '01/09/2023',
    winnerAt: '01/30/2023',
  },
  {
    id: 'row-3',
    announcement: '포항블루밸리 행복주택',
    postedAt: '15/12/2023',
    winnerAt: '01/19/2024',
  },
  {
    id: 'row-4',
    announcement: '부산강서 행복주택',
    postedAt: '23/01/2024',
    winnerAt: '02/20/2024',
  },
  {
    id: 'row-5',
    announcement: '남양주왕숙 A-2블록 공공임대',
    postedAt: '02/02/2024',
    winnerAt: '03/04/2024',
  },
];

const OS_SHARE: OsShare[] = [
  { label: 'WEB', value: 22, color: '#3270ff' },
  { label: 'IOS', value: 38, color: '#22c55e' },
  { label: 'ANDROID', value: 40, color: '#f2d544' },
];

const VISITOR_RANGE_OPTIONS = [1, 7, 14, 30] as const;
type VisitorRange = (typeof VISITOR_RANGE_OPTIONS)[number];
const PREVIEW_LIMIT = 10;

const getConicGradient = (items: OsShare[]) => {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  let cursor = 0;

  const segments = items.map((item) => {
    const start = (cursor / total) * 360;
    cursor += item.value;
    const end = (cursor / total) * 360;
    return `${item.color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${segments.join(', ')})`;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [visitorRange, setVisitorRange] = useState<VisitorRange>(14);
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeRef = useRef<HTMLDivElement>(null);

  const visitorChartData = useMemo(() => {
    if (visitorRange === 1) {
      return VISITOR_HOURLY.map((value, hour) => ({
        key: `hour-${hour}`,
        label: `${hour}시`,
        value,
      }));
    }

    return VISITOR_DAILY.slice(-visitorRange).map((value, index) => ({
      key: `day-${index + 1}`,
      label: `${index + 1}일`,
      value,
    }));
  }, [visitorRange]);
  const previewBugReports = useMemo(
    () => BUG_REPORTS.slice(0, PREVIEW_LIMIT),
    [],
  );
  const previewMissingGeoRows = useMemo(
    () => MISSING_GEO_ROWS.slice(0, PREVIEW_LIMIT),
    [],
  );
  const maxVisitor = Math.max(...visitorChartData.map((item) => item.value), 1);
  const osTotal = OS_SHARE.reduce((sum, item) => sum + item.value, 0);
  const donutGradient = getConicGradient(OS_SHARE);

  useEffect(() => {
    if (!rangeOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (rangeRef.current && !rangeRef.current.contains(event.target as Node)) {
        setRangeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [rangeOpen]);

  return (
    <div>
      <AdminPageHeader title="Dashboard" />

      <section className={styles.section}>
        <div className={styles.dashboardGrid}>
          <div className={styles.summaryRow}>
            {DASHBOARD_STATS.map((card) => (
              <article
                key={card.label}
                className={`${styles.summaryCard} ${card.tone === 'pending' ? styles.pendingCard : styles.newCard}`}
              >
                <p className={styles.summaryLabel}>{card.label}</p>
                <strong className={styles.summaryValue}>{card.value}건</strong>
              </article>
            ))}
          </div>

          <article className={`${styles.panel} ${styles.visitorPanel}`}>
            <div className={styles.visitorTopRow}>
              <div className={styles.chartLegend}>
                <span className={styles.legendDot} aria-hidden />
                <span>방문자 수</span>
              </div>

              <div className={styles.rangeSelect} ref={rangeRef}>
                <button
                  type="button"
                  className={styles.rangeTrigger}
                  onClick={() => setRangeOpen((prev) => !prev)}
                  aria-expanded={rangeOpen}
                  aria-haspopup="listbox"
                >
                  <span className={styles.rangeValue}>{visitorRange}일</span>
                  <span className={styles.rangeCaret}>▾</span>
                </button>

                {rangeOpen && (
                  <div
                    className={styles.rangeMenu}
                    role="listbox"
                    aria-label="방문자 기간 선택"
                  >
                    {VISITOR_RANGE_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`${styles.rangeOption} ${visitorRange === option ? styles.rangeOptionActive : ''}`}
                        onClick={() => {
                          setVisitorRange(option);
                          setRangeOpen(false);
                        }}
                        role="option"
                        aria-selected={visitorRange === option}
                      >
                        {option}일
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              className={styles.barChart}
              style={{
                gridTemplateColumns: `repeat(${visitorChartData.length}, minmax(0, 1fr))`,
              }}
              role="img"
              aria-label={
                visitorRange === 1
                  ? '최근 24시간 방문자 수 차트'
                  : `최근 ${visitorRange}일 방문자 수 차트`
              }
            >
              {visitorChartData.map((item) => (
                <div key={item.key} className={styles.barItem}>
                  <div className={styles.barTrack}>
                    <span
                      className={styles.bar}
                      style={{
                        height: `${Math.max((item.value / maxVisitor) * 100, 10)}%`,
                      }}
                    />
                  </div>
                  <span className={styles.barLabel}>{item.label}</span>
                </div>
              ))}
            </div>
          </article>

          <aside className={`${styles.panel} ${styles.bugPanel}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>버그리포트</h2>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => router.push('/pub/admin/bug')}
              >
                더보기
              </button>
            </div>

            <ul className={styles.bugList}>
              {previewBugReports.map((item) => (
                <li key={item.id} className={styles.bugItem}>
                  <p className={styles.bugTitle}>Error</p>
                  <p className={styles.bugMeta}>
                    <span className={styles.bugMetaDot} aria-hidden />
                    500 - Internal Server Error
                  </p>
                  <p className={styles.bugText}>{item.summary}</p>
                </li>
              ))}
            </ul>
          </aside>

          <article className={`${styles.panel} ${styles.tablePanel}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                좌표가 없는 공고{' '}
                <span className={styles.countAccent}>
                  ({previewMissingGeoRows.length}개)
                </span>
              </h2>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => router.push('/pub/admin/geo')}
              >
                더보기
              </button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>모집공고</th>
                    <th>모집공고일</th>
                    <th>당첨자 발표일</th>
                  </tr>
                </thead>
                <tbody>
                  {previewMissingGeoRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.announcement}</td>
                      <td>{row.postedAt}</td>
                      <td>{row.winnerAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className={`${styles.panel} ${styles.osPanel}`}>
            <div className={styles.panelHeaderBlock}>
              <h2 className={styles.panelTitle}>방문자별 OS</h2>
              <p className={styles.panelSubText}>6월 1일 - 15일, 2025</p>
            </div>

            <div className={styles.osContent}>
              <div
                className={styles.donut}
                style={{ backgroundImage: donutGradient }}
                role="img"
                aria-label="방문자 OS 비율 차트"
              >
                <div className={styles.donutHole}>
                  <strong>{osTotal}</strong>
                </div>
              </div>

              <ul className={styles.osLegend}>
                {OS_SHARE.map((item) => (
                  <li key={item.label} className={styles.osLegendItem}>
                    <span
                      className={styles.osLegendDot}
                      style={{ backgroundColor: item.color }}
                      aria-hidden
                    />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
