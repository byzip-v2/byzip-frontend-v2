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
  const list = useMemo(
    () =>
      statusFilter === 'all'
        ? baseList
        : baseList.filter((r) => r.status === statusFilter),
    [baseList, statusFilter],
  );

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
    <div className={styles.page}>
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
                <th className={styles.assigneeHeader} style={{ width: 140 }}>
                  담당자
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
                    <td className={styles.assignee}>{r.assignee}</td>
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
                <h3 className={styles.drawerSectionTitle}>내용</h3>
                <div className={styles.drawerContentBox}>
                  <div className={styles.rowTitle}>
                    <span className={styles.dot} />
                    <span className={styles.err}>{selected.title}</span>
                  </div>
                  <p className={styles.drawerParagraph}>
                    {selected.detail.replace(
                      '...',
                      ' or misconfiguration and was unable to complete the request.',
                    )}
                  </p>
                </div>
              </section>

              {/* 발생 영역 */}
              <section className={styles.drawerSection}>
                <h3 className={styles.drawerSectionTitle}>발생영역</h3>
                <div className={styles.drawerListBox}>
                  <div className={styles.drawerParagraph}>
                    AxiosError: Request failed with status code 500 at settle
                    (axios/lib/core/settle.js) → IncomingMessage.handleStreamEnd
                    (axios/lib/adapters/http.js) → handleAction(...). 예시
                    로그입니다.
                  </div>
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

              <div className={styles.drawerFooter}>
                <button
                  className={styles.drawerSubmit}
                  disabled={!hasDrawerChanges || isSubmitting}
                  onClick={editReport}
                >
                  {isSubmitting ? <Spinner /> : '수정 완료'}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
      <Alert
        open={alertOpen}
        text="버그 리포트가 수정되었습니다."
        onConfirm={() => setAlertOpen(false)}
      />
    </div>
  );
}
