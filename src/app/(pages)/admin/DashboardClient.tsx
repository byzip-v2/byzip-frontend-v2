'use client';

import AdminPageHeader from '@/app/pub/admin/AdminPageHeader';
import styles from '@/styles/pages/admin/dashboard.module.scss';
import { useRouter } from 'next/navigation';
import type { HousingSupplyDataDto } from 'byzip-v2-sdk';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';

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

interface DashboardClientProps {
  initialStats?: {
    pendingCount: number;
    todayNewCount: number;
  };
  analytics?: {
    dailyVisitors: { date: string; activeUsers: number }[];
    osVisitors: { os: string; activeUsers: number }[];
  };
  missingData?: {
    items: HousingSupplyDataDto[];
    total: number;
  };
}

export default function DashboardClient({
  initialStats,
  analytics,
  missingData,
}: DashboardClientProps) {
  const router = useRouter();
  const [visitorRange, setVisitorRange] = useState<VisitorRange>(14);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [osTooltip, setOsTooltip] = useState<{
    label: string;
    value: number;
    percent: number;
    x: number;
    y: number;
  } | null>(null);
  const [visitorTooltip, setVisitorTooltip] = useState<{
    label: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);
  const [stats] = useState(initialStats || {
    pendingCount: 0,
    todayNewCount: 0,
  });
  const rangeRef = useRef<HTMLDivElement>(null);

  const visitorChartData = useMemo(() => {
    // API 데이터가 있는 경우 우선 사용
    if (analytics?.dailyVisitors && analytics.dailyVisitors.length > 0) {
      // 날짜순으로 정렬 (GA 응답 순서 보장 안될 수 있음)
      const sortedSource = [...analytics.dailyVisitors].sort((a, b) =>
        Number(a.date) - Number(b.date)
      );

      // 최근 N일치 선택 (7일, 14일, 30일 등)
      return sortedSource.slice(-visitorRange).map((item) => {
        // YYYYMMDD -> DD일 형식으로 변환
        const day = item.date.slice(-2);
        return {
          key: `ga-${item.date}`,
          label: `${Number(day)}일`,
          value: item.activeUsers,
        };
      });
    }

    // 데이터가 없는 경우 기존 더미 데이터 유지 (개발용)
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
  }, [visitorRange, analytics]);

  const previewBugReports = useMemo(
    () => BUG_REPORTS.slice(0, PREVIEW_LIMIT),
    [],
  );
  const previewMissingGeoRows = useMemo(() => {
    if (missingData?.items && missingData.items.length > 0) {
      return missingData.items.map((item) => ({
        id: String(item.id),
        announcement: item.houseName || '이름 없음',
        postedAt: item.rcritPblancDe
          ? new Date(item.rcritPblancDe).toLocaleDateString('ko-KR')
          : '-',
        winnerAt: item.przwnerPresnatnDe
          ? new Date(item.przwnerPresnatnDe).toLocaleDateString('ko-KR')
          : '-',
      }));
    }
    return MISSING_GEO_ROWS.slice(0, PREVIEW_LIMIT);
  }, [missingData]);
  const maxVisitor = Math.max(...visitorChartData.map((item) => item.value), 1);
  const osShareData = useMemo((): OsShare[] => {
    if (analytics?.osVisitors && analytics.osVisitors.length > 0) {
      const colors: Record<string, string> = {
        iOS: '#22c55e',
        Android: '#f2d544',
        Windows: '#3270ff',
        Macintosh: '#a855f7',
        Linux: '#ef4444',
      };

      return analytics.osVisitors.map((item) => ({
        label: item.os.toUpperCase(),
        value: item.activeUsers,
        color: colors[item.os] || '#94a3b8',
      }));
    }
    return OS_SHARE;
  }, [analytics]);

  const osTotal = osShareData.reduce((sum, item) => sum + item.value, 0);
  const osSegments = useMemo(() => {
    if (!osTotal) return [];

    let cursor = 0;
    return osShareData.map((item) => {
      const startDeg = cursor;
      cursor += (item.value / osTotal) * 360;
      return {
        ...item,
        startDeg,
        endDeg: cursor,
      };
    });
  }, [osTotal, osShareData]);

  const donutGradient = getConicGradient(osShareData);

  // 차트 최대값 및 수치 레이블 계산
  const { chartMax, uniqueYLabels } = useMemo(() => {
    // 수치가 적을 때 중복 방지 및 여유 공간 확보를 위한 보정
    const max = maxVisitor < 4 ? 4 : Math.ceil(maxVisitor * 1.1);
    const intervals = [
      max,
      Math.round(max * 0.75),
      Math.round(max * 0.5),
      Math.round(max * 0.25),
      0,
    ];

    // 중복 제거 및 내림차순 정렬
    const unique = Array.from(new Set(intervals)).sort((a, b) => b - a);

    return {
      chartMax: max,
      uniqueYLabels: unique,
    };
  }, [maxVisitor]);

  const handleDonutMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!osSegments.length) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const center = rect.width / 2;
    const dx = localX - center;
    const dy = localY - center;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const outerRadius = rect.width / 2;
    const innerRadius = outerRadius * (72 / 128);
    if (distance > outerRadius || distance < innerRadius) {
      setOsTooltip(null);
      return;
    }

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const angleFromTop = (angle + 90 + 360) % 360;

    const segment =
      osSegments.find(
        (item) =>
          angleFromTop >= item.startDeg && angleFromTop < item.endDeg,
      ) ?? osSegments[osSegments.length - 1];

    const percent = Math.round((segment.value / osTotal) * 100);
    setOsTooltip({
      label: segment.label,
      value: segment.value,
      percent,
      x: localX,
      y: localY,
    });
  };

  useEffect(() => {
    if (!rangeOpen) return;

    const handleClickOutside = (event: globalThis.MouseEvent) => {
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
            <article
              className={`${styles.summaryCard} ${styles.pendingCard}`}
            >
              <p className={styles.summaryLabel}>모집중인 공고</p>
              <strong className={styles.summaryValue}>{stats.pendingCount}건</strong>
            </article>
            <article
              className={`${styles.summaryCard} ${styles.newCard}`}
            >
              <p className={styles.summaryLabel}>오늘 올라온 공고</p>
              <strong className={styles.summaryValue}>{stats.todayNewCount}건</strong>
            </article>
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

            <div className={styles.chartContainer}>
              <div className={styles.chartYAxis}>
                {uniqueYLabels.map((label) => (
                  <span key={label} className={styles.yLabel}>
                    {label}
                  </span>
                ))}
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
                <div className={styles.chartGrid}>
                  {uniqueYLabels.map((label) => (
                    <div key={`grid-${label}`} className={styles.gridLine} />
                  ))}
                </div>

                {visitorChartData.map((item) => (
                  <div key={item.key} className={styles.barItem}>
                    <div className={styles.barTrack}>
                      <span
                        className={styles.bar}
                        style={{
                          height: `${Math.max((item.value / chartMax) * 100, 4)}%`,
                        }}
                        onMouseMove={(e) => {
                          const containerRect = e.currentTarget.closest(`.${styles.chartContainer}`)?.getBoundingClientRect();
                          if (containerRect) {
                            setVisitorTooltip({
                              label: item.label,
                              value: item.value,
                              x: e.clientX - containerRect.left,
                              y: e.clientY - containerRect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => setVisitorTooltip(null)}
                      />
                    </div>
                    <span className={styles.barLabel}>{item.label}</span>
                  </div>
                ))}
                {visitorTooltip && (
                  <div
                    className={styles.donutTooltip}
                    style={{ left: `${visitorTooltip.x}px`, top: `${visitorTooltip.y}px` }}
                  >
                    {visitorTooltip.label}: {visitorTooltip.value}명
                  </div>
                )}
              </div>
            </div>
          </article>

          <aside className={`${styles.panel} ${styles.bugPanel}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>버그리포트</h2>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => router.push('/admin/bugs')}
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
                  ({missingData?.total ?? 0}개)
                </span>
              </h2>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => router.push('/admin/geo')}
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
              <p className={styles.panelSubText}>
                {(() => {
                  const now = new Date();
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(now.getDate() - 30);

                  const formatDate = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
                  return `${formatDate(thirtyDaysAgo)} - ${formatDate(now)}, ${now.getFullYear()}`;
                })()}
              </p>
            </div>

            <div className={styles.osContent}>
              <div className={styles.donutWrap}>
                <div
                  className={styles.donut}
                  style={{ backgroundImage: donutGradient }}
                  role="img"
                  aria-label="방문자 OS 비율 차트"
                  onMouseMove={handleDonutMouseMove}
                  onMouseLeave={() => setOsTooltip(null)}
                >
                  <div className={styles.donutHole}>
                    <strong>{osTotal}</strong>
                  </div>
                </div>
                {osTooltip && (
                  <div
                    className={styles.donutTooltip}
                    style={{ left: `${osTooltip.x}px`, top: `${osTooltip.y}px` }}
                  >
                    {osTooltip.label}: {osTooltip.value}명 ({osTooltip.percent}%)
                  </div>
                )}
              </div>

              <ul className={styles.osLegend}>
                {osShareData.map((item) => (
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
