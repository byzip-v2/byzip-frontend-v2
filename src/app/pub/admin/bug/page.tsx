'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Spinner from '@/app/components/common/Spinner/Spinner';
import Alert from '@/app/components/common/Alert/Alert';
import styles from '@/styles/pages/admin/bug/bug.module.scss';
import AdminPageHeader from '@/app/pub/admin/AdminPageHeader';

type BugStatus = 'in-progress' | 'completed' | 'needed' | 'not-bug';
const ASSIGNEES = ['박성환', '이희령', '정윤숙'] as const;
type AssigneeName = (typeof ASSIGNEES)[number];
type StatusFilter = 'all' | 'needed' | 'in-progress' | 'completed';
const STATUS_ORDER: BugStatus[] = [
  'in-progress',
  'completed',
  'needed',
  'not-bug',
];

type BugRow = {
  id: string;
  title: string; // 짧은 제목 (ex. 500 - Internal Server Error)
  detail: string; // 한 줄 설명
  count: number; // 발생 횟수
  lastOccurredAt: string; // 발생일
  status: BugStatus; // 상태
  memo: string; // 메모
  assignee: AssigneeName; // 담당자
};

const MOCK: BugRow[] = [
  {
    id: 'uuid',
    title: '500 - Internal Server Error',
    detail:
      'The server encountered an internal error or misconfiguration and was unable to complete the request.',
    count: 12,
    lastOccurredAt: '2025.03.21 11:32:44',
    status: 'completed',
    memo: '메인 페이지 속도 저하 원인 분석 중으로, 캐시 미스와 DB 쿼리 지연이 겹쳐 응답 시간이 증가했습니다.',
    assignee: '박성환',
  },
  {
    id: 'uuid',
    title: '500 - Internal Server Error',
    detail:
      'The server encountered an internal error while processing your request due to cache sync lag.',
    count: 8,
    lastOccurredAt: '2025.03.20 11:32:44',
    status: 'in-progress',
    memo: '메인 페이지 속도 저하 원인을 파악하기 위해 쿼리 튜닝과 이미지 최적화를 진행 예정입니다.',
    assignee: '정윤숙',
  },
  {
    id: 'uuid',
    title: '500 - Internal Server Error',
    detail:
      'The server encountered an internal error caused by a missing environment variable in production.',
    count: 7,
    lastOccurredAt: '2025.03.19 11:32:44',
    status: 'needed',
    memo: '메인 페이지 속도 저하 원인 재검토 중이며, API 응답 지연과 CDN 설정을 확인해야 합니다.',
    assignee: '이희령',
  },
  {
    id: 'uuid',
    title: '500 - Internal Server Error',
    detail:
      'The server encountered an internal error while rendering the dashboard widget for sales metrics.',
    count: 4,
    lastOccurredAt: '2025.03.18 11:32:44',
    status: 'needed',
    memo: '메인 페이지 속도 저하 원인 확인 완료, 이미지 압축과 프리페치 개선이 필요합니다.',
    assignee: '박성환',
  },
  {
    id: 'uuid',
    title: '500 - Internal Server Error',
    detail:
      'The server encountered an internal error after a deployment when session storage was flushed.',
    count: 4,
    lastOccurredAt: '2025.03.17 11:32:44',
    status: 'not-bug',
    memo: '메인 페이지 속도 저하 원인 파악 중, 실시간 알림 로직이 병목을 유발해 장애가 반복될 수 있습니다.',
    assignee: '정윤숙',
  },
  {
    id: 'uuid',
    title: '500 - Internal Server Error',
    detail:
      'The server encountered an internal error because the report export job exceeded time limits.',
    count: 2,
    lastOccurredAt: '2025.03.16 11:32:44',
    status: 'completed',
    memo: '메인 페이지 속도 저하 원인 임시 조치 완료, 캐시 만료 정책을 재설정해야 합니다.',
    assignee: '이희령',
  },
  {
    id: 'uuid',
    title: '500 - Internal Server Error',
    detail:
      'The server encountered an internal error from a failing third-party API dependency.',
    count: 1,
    lastOccurredAt: '2025.03.15 11:32:44',
    status: 'not-bug',
    memo: '메인 페이지 속도 저하 원인으로 추정되는 로그 수집기 부하를 분산해야 합니다.',
    assignee: '박성환',
  },
];

const STATUS_LABEL: Record<BugStatus, string> = {
  'in-progress': '해결중',
  completed: '해결완료',
  needed: '해결필요',
  'not-bug': '버그아님',
};

export default function BugReportPage() {
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<BugRow | null>(null);
  const [detailStatus, setDetailStatus] = useState<BugStatus>('in-progress');
  const [detailAssignee, setDetailAssignee] = useState<AssigneeName | null>(
    null,
  );
  const [detailMemo, setDetailMemo] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(
    new Set(),
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [statusActionOpen, setStatusActionOpen] = useState(false);
  const statusActionRef = useRef<HTMLDivElement>(null);
  const [initialDetail, setInitialDetail] = useState<{
    status: BugStatus;
    assignee: AssigneeName;
    memo: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [viewer, setViewer] = useState<{ title: string; text: string } | null>(
    null,
  );
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeName | 'all'>(
    'all',
  );
  const [assigneeFilterOpen, setAssigneeFilterOpen] = useState(false);
  const assigneeFilterRef = useRef<HTMLTableCellElement>(null);
  const assigneeBtnRef = useRef<HTMLButtonElement>(null);
  const [assigneeMenuPos, setAssigneeMenuPos] = useState<{ x: number; y: number } | null>(null);
  const assigneeMenuRef = useRef<HTMLDivElement>(null);

  // 검색어 적용된 원본 리스트
  const baseList = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return MOCK;
    return MOCK.filter(
      (r) =>
        r.title.toLowerCase().includes(keyword) ||
        r.detail.toLowerCase().includes(keyword) ||
        r.memo.toLowerCase().includes(keyword),
    );
  }, [q]);

  // 상태 필터 적용 리스트
  const list = useMemo(() => {
    const byStatus =
      statusFilter === 'all'
        ? baseList
        : baseList.filter((r) => r.status === statusFilter);
    if (assigneeFilter === 'all') return byStatus;
    return byStatus.filter((r) => r.assignee === assigneeFilter);
  }, [assigneeFilter, baseList, statusFilter]);

  const stats = useMemo(() => {
    const needed = baseList.filter((r) => r.status === 'needed').length;
    const inProgress = baseList.filter(
      (r) => r.status === 'in-progress',
    ).length;
    const completed = baseList.filter((r) => r.status === 'completed').length;
    return { needed, inProgress, completed, total: baseList.length };
  }, [baseList]);

  // 현재 테이블에 보이는 행 키
  const visibleRowKeys = useMemo(
    () => list.map((r, i) => `${r.id}-${i}`),
    [list],
  );

  const allVisibleSelected =
    visibleRowKeys.length > 0 &&
    visibleRowKeys.every((key) => selectedRowKeys.has(key));
  const hasSelection = selectedRowKeys.size > 0;

  // 선택이 없으면 상태변경 드롭다운 닫기
  useEffect(() => {
    if (!hasSelection) setStatusActionOpen(false);
  }, [hasSelection]);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!statusActionOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        statusActionRef.current &&
        !statusActionRef.current.contains(e.target as Node)
      ) {
        setStatusActionOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [statusActionOpen]);

  // 헤더 checkbox 토글
  const handleToggleAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedRowKeys(new Set([...selectedRowKeys, ...visibleRowKeys]));
    } else {
      const next = new Set(selectedRowKeys);
      visibleRowKeys.forEach((key) => next.delete(key));
      setSelectedRowKeys(next);
    }
  };

  // 행 checkbox 토글
  const handleToggleRow = (key: string, checked: boolean) => {
    const next = new Set(selectedRowKeys);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    setSelectedRowKeys(next);
  };

  // 행 클릭 시 서랍 오픈
  const handleRowClick = (row: BugRow) => {
    setSelected(row);
    setDetailStatus(row.status);
    setDetailAssignee(row.assignee);
    setDetailMemo(row.memo);
    setInitialDetail({
      status: row.status,
      assignee: row.assignee,
      memo: row.memo,
    });
    setStatusOpen(false);
    setAssigneeOpen(false);
  };

  const closeDrawer = () => setSelected(null);

  const handleSelectStatus = (status: BugStatus) => {
    setDetailStatus(status);
    setStatusOpen(false);
  };

  const handleSelectAssignee = (name: AssigneeName) => {
    setDetailAssignee(name);
    setAssigneeOpen(false);
  };

  const toggleFilter = (next: StatusFilter) => {
    setStatusFilter((prev) => (prev === next ? 'all' : next));
  };

  const handleToggleStatusAction = () => {
    if (!hasSelection) return;
    setStatusActionOpen((v) => !v);
  };

  useEffect(() => {
    // 서랍이 열려 있을 때 배경 스크롤 방지
    if (selected) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selected]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideHeader =
        assigneeFilterRef.current &&
        assigneeFilterRef.current.contains(target);
      const insideMenu =
        assigneeMenuRef.current && assigneeMenuRef.current.contains(target);
      if (!insideHeader && !insideMenu) {
        setAssigneeFilterOpen(false);
        setAssigneeMenuPos(null);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  const handleBulkStatusSelect = () => {
    // 퍼블 상태: 선택 후 닫기만 수행
    setStatusActionOpen(false);
  };

  const handleSearch = async () => {
    setQ(searchInput);
    setIsSearching(true);
    try {
      // API 호출 자리
      await new Promise((resolve) => setTimeout(resolve, 600));
    } finally {
      setIsSearching(false);
    }
  };

  const hasDrawerChanges =
    !!selected &&
    !!initialDetail &&
    (detailStatus !== initialDetail.status ||
      detailAssignee !== initialDetail.assignee ||
      detailMemo !== initialDetail.memo);

  const contentText = selected
    ? selected.detail.replace(
        '...',
        ' or misconfiguration and was unable to complete the request.',
      )
    : '';
  const errorStackText =
    'AxiosError: Request failed with status code 500 at settle (axios/lib/core/settle.js) → IncomingMessage.handleStreamEnd (axios/lib/adapters/http.js) → handleAction(...) → renderErrorModal(...) → submitBugReport(...). 재현 스택이며 긴 내용이 들어왔을 때 영역 내 스크롤이 생깁니다. 추가 라인: requestId=9f1e-22aa span=fetchUserProfile status=500 retry=0.';
  const metadataText =
    'traceId: 2f83a-10ab9, release: v1.2.3, locale: ko-KR, device: desktop, featureFlag: bug-fix-24, session: s-233423, correlation: c-9aa-2b33. 긴 메타데이터가 들어올 때도 영역 안에서만 스크롤됩니다.';
  const errorUrlText =
    'https://app.by-zip.com/admin/bug?projectId=42&view=detail&tab=stack&traceId=2f83a-10ab9&lang=ko-KR&feature=bug-fix-24';
  const userAgentText =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36; foo-bar-extension/3.1.4; viewport=1440x900; long UA sample to trigger overflow scrolling.';

  const openViewer = (title: string, text: string) => setViewer({ title, text });

  const editReport = async () => {
    if (!selected || !initialDetail) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/slack/bug-assignee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occurredAt: selected.lastOccurredAt,
          status: detailStatus,
          prevAssignee: initialDetail.assignee,
          nextAssignee: detailAssignee ?? initialDetail.assignee,
        }),
      });
      setAlertOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="버그 리포트" />

      {/* 통계 카드 */}
      <section className={styles.stats}>
        <button
          type="button"
          className={`${styles.card} ${styles.cardButton} ${styles.yellow} ${
            statusFilter === 'needed' ? styles.activeCard : ''
          }`}
          onClick={() => toggleFilter('needed')}
        >
          <div className={styles.cardLabel}>해결 필요</div>
          <div className={styles.cardNum}>{stats.needed}건</div>
        </button>
        <button
          type="button"
          className={`${styles.card} ${styles.cardButton} ${styles.mint} ${
            statusFilter === 'in-progress' ? styles.activeCard : ''
          }`}
          onClick={() => toggleFilter('in-progress')}
        >
          <div className={styles.cardLabel}>해결중인 버그</div>
          <div className={styles.cardNum}>{stats.inProgress}건</div>
        </button>
        <button
          type="button"
          className={`${styles.card} ${styles.cardButton} ${styles.purple} ${
            statusFilter === 'completed' ? styles.activeCard : ''
          }`}
          onClick={() => toggleFilter('completed')}
        >
          <div className={styles.cardLabel}>해결완료</div>
          <div className={styles.cardNum}>{stats.completed}건</div>
        </button>
      </section>
      {/* 검색 */}
      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <input
            placeholder="검색할 내용을 입력해 주세요."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Spinner /> : '검색'}
          </button>
          <div className={styles.statusDropdownWrap} ref={statusActionRef}>
            <button
              type="button"
              className={styles.statusActionBtn}
              disabled={!hasSelection}
              onClick={handleToggleStatusAction}
              aria-expanded={statusActionOpen}
            >
              상태변경
            </button>
            {statusActionOpen && (
              <div className={styles.statusActionMenu}>
                {STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={styles.statusActionOption}
                    onClick={handleBulkStatusSelect}
                  >
                    {STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <section className={styles.tableWrap}>
        <div className={styles.total}>
          Total <span className={styles.totalNum}>{stats.total}</span> bugs
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 60 }}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => handleToggleAllVisible(e.target.checked)}
                  />
                </th>
                <th style={{ width: 400 }}>내용</th>
                <th style={{ width: 150 }}>발생일</th>
                <th style={{ width: 200 }}>상태</th>
                <th style={{ width: 240 }}>메모</th>
                <th
                  className={styles.assigneeHeader}
                  style={{ width: 140, position: 'relative' }}
                  ref={assigneeFilterRef}
                >
                  <button
                    type="button"
                    className={styles.assigneeFilterBtn}
                    ref={assigneeBtnRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = !assigneeFilterOpen;
                      setAssigneeFilterOpen(next);
                      if (next && assigneeBtnRef.current) {
                        const rect = assigneeBtnRef.current.getBoundingClientRect();
                        setAssigneeMenuPos({ x: rect.left, y: rect.bottom });
                      } else {
                        setAssigneeMenuPos(null);
                      }
                    }}
                  >
                    <span>담당자</span>
                    <span className={styles.assigneeCaret}>▾</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => {
                const rowKey = `${r.id}-${i}`;
                const rowChecked = selectedRowKeys.has(rowKey);
                return (
                  <tr
                    key={rowKey}
                    className={`${selected === r ? styles.rowSelected : ''}`}
                    onClick={() => handleRowClick(r)}
                  >
                    {/* 체크박스 */}
                    <td className={styles.checkCell}>
                      <input
                        type="checkbox"
                        checked={rowChecked}
                        onChange={(e) =>
                          handleToggleRow(rowKey, e.target.checked)
                        }
                        onClick={(e) => e.stopPropagation()} // 체크 클릭해도 행 클릭 안 타게
                      />
                    </td>

                    {/* 내용(제목 + 디스크립션) */}
                    <td>
                      <div className={styles.rowTitle}>
                        <span className={styles.dot} />
                        <span className={styles.err}>{r.title}</span>
                      </div>
                      <div className={styles.rowDetail}>{r.detail}</div>
                    </td>

                    {/* 발생일 */}
                    <td>{r.lastOccurredAt}</td>

                    {/* 상태 뱃지 */}
                    <td>
                      <span
                        className={`${styles.badge} ${
                          r.status === 'completed'
                            ? styles.statusDone
                            : r.status === 'in-progress'
                              ? styles.statusProgress
                              : r.status === 'needed'
                                ? styles.statusNeeded
                                : styles.statusNotBug
                        }`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>

                    {/* 메모 */}
                    <td className={styles.ellipsis}>{r.memo}</td>

                    {/* 담당자 */}
                    <td className={styles.assignee}>
                      <span
                        className={`${styles.assigneeBadge} ${
                          r.assignee === '이희령'
                            ? styles.assigneePurple
                            : r.assignee === '정윤숙'
                              ? styles.assigneeBlue
                              : styles.assigneeGreen
                        }`}
                      >
                        {r.assignee}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 (퍼블용 더미) */}
        <div className={styles.paging}>
          <button className={styles.arrow}>{'<'}</button>
          {[1, 2, 3, 4, 10, 11].map((n, idx) => (
            <button
              key={idx}
              className={`${styles.pageBtn} ${n === 1 ? styles.active : ''}`}
            >
              {n}
            </button>
          ))}
          <button className={styles.arrow}>{'>'}</button>
        </div>
      </section>
      {/* 오른쪽 디테일 서랍 */}
      {selected && (
        <>
          <div className={styles.drawerBackdrop} onClick={closeDrawer} />
          <aside className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <button className={styles.drawerClose} onClick={closeDrawer}>
                ✕
              </button>
              <div className={styles.drawerHeaderActions}>
                <button
                  className={styles.drawerSubmit}
                  disabled={!hasDrawerChanges || isSubmitting}
                  onClick={editReport}
                >
                  {isSubmitting ? <Spinner /> : '수정 완료'}
                </button>
              </div>
            </div>
          <div className={styles.drawerBody}>
            <div className={styles.drawerMeta}>
              <div className={styles.drawerLabel}>발생일</div>
              <div className={styles.drawerId}>{selected.lastOccurredAt}</div>
              </div>
              <div className={styles.drawerRowTop}>
                <div className={styles.drawerField}>
                  <span className={styles.drawerLabel}>상태</span>
                  <div className={styles.selectField}>
                    <button
                      type="button"
                      className={styles.selectTrigger}
                      onClick={() => {
                        setStatusOpen((v) => !v);
                        setAssigneeOpen(false);
                      }}
                      aria-expanded={statusOpen}
                    >
                      <span className={styles.selectValue}>
                        {STATUS_LABEL[detailStatus]}
                      </span>
                      <span className={styles.selectCaret}>▾</span>
                    </button>
                    {statusOpen && (
                      <div className={styles.selectMenu}>
                        {STATUS_ORDER.map((status) => (
                          <button
                            key={status}
                            type="button"
                            className={`${styles.selectOption} ${
                              detailStatus === status ? styles.active : ''
                            }`}
                            onClick={() => handleSelectStatus(status)}
                          >
                            {STATUS_LABEL[status]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.drawerField}>
                  <span className={styles.drawerLabel}>담당자</span>
                  <div className={styles.selectField}>
                    <button
                      type="button"
                      className={styles.selectTrigger}
                      onClick={() => {
                        setAssigneeOpen((v) => !v);
                        setStatusOpen(false);
                      }}
                      aria-expanded={assigneeOpen}
                    >
                      <span
                        className={
                          detailAssignee
                            ? styles.selectValue
                            : styles.selectPlaceholder
                        }
                      >
                        {detailAssignee ?? '담당자 선택'}
                      </span>
                      <span className={styles.selectCaret}>▾</span>
                    </button>
                    {assigneeOpen && (
                      <div className={styles.selectMenu}>
                        {ASSIGNEES.map((name) => (
                          <button
                            key={name}
                            type="button"
                            className={`${styles.selectOption} ${
                              detailAssignee === name ? styles.active : ''
                            }`}
                            onClick={() => handleSelectAssignee(name)}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 내용 */}
              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionHeader}>
                  <h3 className={styles.drawerSectionTitle}>내용</h3>
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() => openViewer('내용', contentText)}
                    aria-label="내용 자세히 보기"
                  >
                    ...
                  </button>
                </div>
                <div className={styles.drawerContentBox}>
                  <div className={styles.rowTitle}>
                    <span className={styles.dot} />
                    <span className={styles.err}>{selected.title}</span>
                  </div>
                  <p className={styles.drawerParagraph}>{contentText}</p>
                </div>
              </section>

              {/* 발생 영역 */}
              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionHeader}>
                  <h3 className={styles.drawerSectionTitle}>에러스택</h3>
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() => openViewer('에러스택', errorStackText)}
                    aria-label="에러스택 자세히 보기"
                  >
                    ...
                  </button>
                </div>
                <div className={styles.drawerListBox}>
                  <div className={styles.drawerParagraph}>{errorStackText}</div>
                </div>
              </section>

              {/* 메타데이터 */}
              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionHeader}>
                  <h3 className={styles.drawerSectionTitle}>메타데이터</h3>
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() => openViewer('메타데이터', metadataText)}
                    aria-label="메타데이터 자세히 보기"
                  >
                    ...
                  </button>
                </div>
                <div className={styles.drawerListBox}>
                  <div className={styles.drawerParagraph}>{metadataText}</div>
                </div>
              </section>

              {/* 에러 발생 위치 */}
              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionHeader}>
                  <h3 className={styles.drawerSectionTitle}>
                    에러발생위치 URL
                  </h3>
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() => openViewer('에러발생위치 URL', errorUrlText)}
                    aria-label="에러발생위치 URL 자세히 보기"
                  >
                    ...
                  </button>
                </div>
                <div className={styles.drawerListBox}>
                  <div className={styles.drawerParagraph}>{errorUrlText}</div>
                </div>
              </section>

              {/* userAgent */}
              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionHeader}>
                  <h3 className={styles.drawerSectionTitle}>userAgent</h3>
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() => openViewer('userAgent', userAgentText)}
                    aria-label="userAgent 자세히 보기"
                  >
                    ...
                  </button>
                </div>
                <div className={styles.drawerListBox}>
                  <div className={styles.drawerParagraph}>{userAgentText}</div>
                </div>
              </section>

              {/* 메모 */}
              <section className={styles.drawerSection}>
                <h3 className={styles.drawerSectionTitle}>메모</h3>
                <textarea
                  className={styles.drawerMemo}
                  value={detailMemo}
                  onChange={(e) => setDetailMemo(e.target.value)}
                />
              </section>
            </div>
          </aside>
        </>
      )}
      <Alert
        open={alertOpen}
        text="버그 리포트가 수정되었습니다."
        onConfirm={() => setAlertOpen(false)}
      />
      {assigneeFilterOpen && assigneeMenuPos && (
        <div
          className={styles.assigneeMenuFixed}
          style={{
            left: Math.max(8, assigneeMenuPos.x - 16),
            top: assigneeMenuPos.y + 2,
          }}
          ref={assigneeMenuRef}
        >
          <button
            type="button"
            className={`${styles.assigneeOption} ${
              assigneeFilter === 'all' ? styles.active : ''
            }`}
            onClick={() => {
              setAssigneeFilter('all');
              setAssigneeFilterOpen(false);
              setAssigneeMenuPos(null);
            }}
          >
            전체
          </button>
          {ASSIGNEES.map((name) => (
            <button
              key={name}
              type="button"
              className={`${styles.assigneeOption} ${
                assigneeFilter === name ? styles.active : ''
              }`}
              onClick={() => {
                setAssigneeFilter(name);
                setAssigneeFilterOpen(false);
                setAssigneeMenuPos(null);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {viewer && (
        <div
          className={styles.viewerBackdrop}
          onClick={() => setViewer(null)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className={styles.viewerModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.viewerHeader}>
              <h4 className={styles.viewerTitle}>{viewer.title}</h4>
              <button
                type="button"
                className={styles.viewerClose}
                onClick={() => setViewer(null)}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className={styles.viewerBody}>{viewer.text}</div>
            <div className={styles.viewerActions}>
              <button
                type="button"
                className={styles.viewerConfirm}
                onClick={() => setViewer(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
