'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/pages/admin/bug/bug.module.scss';
import {
  updateBugReport,
  bulkUpdateBugStatus,
  type PaginationMeta,
  type BugReportDataDtoWithMemo,
} from '../actions';

interface BugReportClientProps {
  initialBugs: BugReportDataDtoWithMemo[];
  initialMeta?: PaginationMeta;
  searchParams: {
    q?: string;
    status?: string;
    page?: string;
  };
}

export type BugStatus = 'needed' | 'in-progress' | 'completed' | 'not-bug';
export type StatusFilter = 'all' | 'needed' | 'in-progress' | 'completed';

export const ASSIGNEES = ['박성환', '이희령', '정윤숙'] as const;
export type AssigneeName = (typeof ASSIGNEES)[number];

export const STATUS_ORDER: BugStatus[] = [
  'in-progress',
  'completed',
  'needed',
  'not-bug',
];

export const STATUS_LABEL: Record<BugStatus, string> = {
  'in-progress': '해결중',
  completed: '해결완료',
  needed: '해결필요',
  'not-bug': '버그아님',
};

// API 상태 -> UI 상태 매핑
export const mapApiToUiStatus = (apiStatus: string): BugStatus => {
  switch (apiStatus) {
    case 'open':
      return 'needed';
    case 'in_progress':
      return 'in-progress';
    case 'resolved':
      return 'completed';
    case 'closed':
      return 'not-bug';
    default:
      return 'needed';
  }
};

// UI 상태 -> API 상태 매핑
export const mapUiToApiStatus = (uiStatus: BugStatus): string => {
  switch (uiStatus) {
    case 'needed':
      return 'open';
    case 'in-progress':
      return 'in_progress';
    case 'completed':
      return 'resolved';
    case 'not-bug':
      return 'closed';
  }
};

export default function BugReportPage({
  initialBugs,
  initialMeta,
  searchParams,
}: BugReportClientProps) {
  const router = useRouter();

  const [q, setQ] = useState(searchParams.q || '');

  // URL 파라미터 변경 시 검색창 상태 동기화
  useEffect(() => {
    setQ(searchParams.q || '');
  }, [searchParams.q]);

  const [selected, setSelected] = useState<BugReportDataDtoWithMemo | null>(
    null,
  );
  const [detailStatus, setDetailStatus] = useState<BugStatus>('needed');
  const [detailAssignee, setDetailAssignee] = useState<string | null>(null);
  const [detailMemo, setDetailMemo] = useState('');

  const [statusOpen, setStatusOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [statusActionOpen, setStatusActionOpen] = useState(false);
  const statusActionRef = useRef<HTMLDivElement>(null);

  const [initialDetail, setInitialDetail] = useState<{
    status: BugStatus;
    assigneeId: string | null;
    memo: string;
  } | null>(null);

  const statusFilter = (searchParams.status as StatusFilter) || 'all';

  // 데이터 가공
  const processedBugs = useMemo(() => {
    return initialBugs.map((bug) => ({
      ...bug,
      uiStatus: mapApiToUiStatus(bug.status),
      formattedDate: new Date(bug.createdAt)
        .toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
        .replace(/-/g, '.'),
    }));
  }, [initialBugs]);

  // URL 업데이트 유틸리티
  const updateUrl = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(window.location.search);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'all') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.push(`?${params.toString()}`);
    },
    [router],
  );

  // 검색 실행
  const handleSearch = () => {
    updateUrl({ q, page: 1 });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const allVisibleSelected =
    processedBugs.length > 0 &&
    processedBugs.every((bug) => selectedRowIds.has(bug.id));
  const hasSelection = selectedRowIds.size > 0;

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
      const next = new Set(selectedRowIds);
      processedBugs.forEach((bug) => next.add(bug.id));
      setSelectedRowIds(next);
    } else {
      const next = new Set(selectedRowIds);
      processedBugs.forEach((bug) => next.delete(bug.id));
      setSelectedRowIds(next);
    }
  };

  // 행 checkbox 토글
  const handleToggleRow = (id: number, checked: boolean) => {
    const next = new Set(selectedRowIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedRowIds(next);
  };

  // 행 클릭 시 서랍 오픈
  const handleRowClick = (bug: BugReportDataDtoWithMemo) => {
    const uiStatus = mapApiToUiStatus(bug.status);
    setSelected(bug);
    setDetailStatus(uiStatus);
    setDetailAssignee(bug.assigneeId || null);
    setDetailMemo(bug.memo || '');
    setInitialDetail({
      status: uiStatus,
      assigneeId: bug.assigneeId || null,
      memo: bug.memo || '',
    });
    setStatusOpen(false);
    setAssigneeOpen(false);
  };

  const closeDrawer = () => setSelected(null);

  const handleSelectStatus = (status: BugStatus) => {
    setDetailStatus(status);
    setStatusOpen(false);
  };

  const handleSelectAssignee = (name: string) => {
    setDetailAssignee(name);
    setAssigneeOpen(false);
  };

  const toggleFilter = (next: StatusFilter) => {
    const newStatus = statusFilter === next ? 'all' : next;
    updateUrl({ status: newStatus, page: 1 });
  };

  const handleToggleStatusAction = () => {
    if (!hasSelection) return;
    setStatusActionOpen((v) => !v);
  };

  const handleBulkStatusSelect = async (status: BugStatus) => {
    const apiStatus = mapUiToApiStatus(status);
    const ids = Array.from(selectedRowIds);

    const result = await bulkUpdateBugStatus(ids, apiStatus);
    if (result.success) {
      setStatusActionOpen(false);
      setSelectedRowIds(new Set());
      router.refresh(); // 데이터 새로고침
    } else {
      alert(result.message);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;

    const apiStatus = mapUiToApiStatus(detailStatus);
    const result = await updateBugReport(selected.id, {
      status: apiStatus,
      assigneeId: detailAssignee || undefined,
      memo: detailMemo,
    });

    if (result.success) {
      closeDrawer();
      router.refresh(); // 데이터 새로고침
    } else {
      alert(result.message);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (initialMeta && (newPage < 1 || newPage > initialMeta.totalPages))
      return;
    updateUrl({ page: newPage });
  };

  const hasDrawerChanges =
    !!selected &&
    !!initialDetail &&
    (detailStatus !== initialDetail.status ||
      detailAssignee !== initialDetail.assigneeId ||
      detailMemo !== initialDetail.memo);

  return (
    <div className={styles.page}>
      {/* 상단 타이틀 */}
      <div className={styles.head}>
        <h1 className={styles.title}>버그 리포트</h1>
      </div>

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
          <div className={styles.cardNum}>
            {statusFilter === 'needed' && initialMeta ? initialMeta.total : '-'}
          </div>
        </button>
        <button
          type="button"
          className={`${styles.card} ${styles.cardButton} ${styles.mint} ${
            statusFilter === 'in-progress' ? styles.activeCard : ''
          }`}
          onClick={() => toggleFilter('in-progress')}
        >
          <div className={styles.cardLabel}>해결중인 버그</div>
          <div className={styles.cardNum}>
            {statusFilter === 'in-progress' && initialMeta
              ? initialMeta.total
              : '-'}
          </div>
        </button>
        <button
          type="button"
          className={`${styles.card} ${styles.cardButton} ${styles.purple} ${
            statusFilter === 'completed' ? styles.activeCard : ''
          }`}
          onClick={() => toggleFilter('completed')}
        >
          <div className={styles.cardLabel}>해결완료</div>
          <div className={styles.cardNum}>
            {statusFilter === 'completed' && initialMeta
              ? initialMeta.total
              : '-'}
          </div>
        </button>
      </section>

      {/* 검색 */}
      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <input
            placeholder="검색할 내용을 입력해 주세요."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={handleSearch}>검색</button>
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
                    onClick={() => handleBulkStatusSelect(status)}
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
          Total{' '}
          <span className={styles.totalNum}>{initialMeta?.total || 0}</span>{' '}
          bugs
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
              {processedBugs.map((r) => {
                const rowChecked = selectedRowIds.has(r.id);
                return (
                  <tr
                    key={r.id}
                    className={`${selected?.id === r.id ? styles.rowSelected : ''}`}
                    onClick={() => handleRowClick(r)}
                  >
                    <td className={styles.checkCell}>
                      <input
                        type="checkbox"
                        checked={rowChecked}
                        onChange={(e) =>
                          handleToggleRow(r.id, e.target.checked)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>
                      <div className={styles.rowTitle}>
                        <span className={styles.dot} />
                        <span className={styles.err}>{r.title}</span>
                      </div>
                      <div className={styles.rowDetail}>{r.description}</div>
                    </td>
                    <td>{r.formattedDate}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          r.uiStatus === 'completed'
                            ? styles.statusDone
                            : r.uiStatus === 'in-progress'
                              ? styles.statusProgress
                              : r.uiStatus === 'needed'
                                ? styles.statusNeeded
                                : styles.statusNotBug
                        }`}
                      >
                        {STATUS_LABEL[r.uiStatus]}
                      </span>
                    </td>
                    <td className={styles.ellipsis}>{r.memo || '-'}</td>
                    <td className={styles.assignee}>
                      {r.assigneeId || '미지정'}
                    </td>
                  </tr>
                );
              })}
              {processedBugs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '100px 0' }}
                  >
                    리포트가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {initialMeta && initialMeta.totalPages > 1 && (
          <div className={styles.paging}>
            <button
              className={styles.arrow}
              onClick={() => handlePageChange(initialMeta.page - 1)}
              disabled={initialMeta.page === 1}
            >
              {'<'}
            </button>
            {Array.from(
              { length: Math.min(10, initialMeta.totalPages) },
              (_, i) => {
                const startPage = Math.max(
                  1,
                  Math.min(initialMeta.page - 4, initialMeta.totalPages - 9),
                );
                const p = startPage + i;
                if (p > initialMeta.totalPages) return null;
                return (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${p === initialMeta.page ? styles.active : ''}`}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                );
              },
            )}
            <button
              className={styles.arrow}
              onClick={() => handlePageChange(initialMeta.page + 1)}
              disabled={initialMeta.page === initialMeta.totalPages}
            >
              {'>'}
            </button>
          </div>
        )}
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
                <div className={styles.drawerId}>
                  {new Date(selected.createdAt).toLocaleString()}
                </div>
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

              <section className={styles.drawerSection}>
                <h3 className={styles.drawerSectionTitle}>내용</h3>
                <div className={styles.drawerContentBox}>
                  <div className={styles.rowTitle}>
                    <span className={styles.dot} />
                    <span className={styles.err}>{selected.title}</span>
                  </div>
                  <p className={styles.drawerParagraph}>
                    {selected.description}
                  </p>
                  {selected.errorMessage && (
                    <p
                      className={styles.drawerParagraph}
                      style={{ marginTop: '10px', color: '#ff4d4f' }}
                    >
                      <strong>ErrorMessage:</strong> {selected.errorMessage}
                    </p>
                  )}
                </div>
              </section>

              <section className={styles.drawerSection}>
                <h3 className={styles.drawerSectionTitle}>에러 스택</h3>
                <div className={styles.drawerListBox}>
                  <div
                    className={styles.drawerParagraph}
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {selected.errorStack || '스택 정보 없음'}
                  </div>
                </div>
              </section>

              {selected.metadata &&
                Object.keys(selected.metadata).length > 0 && (
                  <section className={styles.drawerSection}>
                    <h3 className={styles.drawerSectionTitle}>메타데이터</h3>
                    <div className={styles.drawerListBox}>
                      <pre style={{ fontSize: '11px', overflowX: 'auto' }}>
                        {JSON.stringify(selected.metadata, null, 2)}
                      </pre>
                    </div>
                  </section>
                )}

              <section className={styles.drawerSection}>
                <h3 className={styles.drawerSectionTitle}>메모</h3>
                <textarea
                  className={styles.drawerMemo}
                  value={detailMemo}
                  onChange={(e) => setDetailMemo(e.target.value)}
                  placeholder="메모를 입력해 주세요."
                />
              </section>

              <div className={styles.drawerFooter}>
                <button
                  className={styles.drawerSubmit}
                  disabled={!hasDrawerChanges}
                  onClick={handleUpdate}
                >
                  수정 완료
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
