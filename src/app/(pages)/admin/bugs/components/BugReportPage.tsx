'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { BugReportStatus } from 'byzip-v2-sdk';
import styles from '@/styles/pages/admin/bug/bug.module.scss';
import {
  updateBugReport,
  type PaginationMeta,
  type BugReportDataDtoWithMemo,
  type StatusCounts,
} from '../actions';
import Spinner from '../../../../components/common/Spinner/Spinner';
import AdminPageHeader from '@/app/pub/admin/AdminPageHeader';
import Alert from '@/app/components/common/Alert/Alert';

interface BugReportClientProps {
  initialBugs: BugReportDataDtoWithMemo[];
  initialMeta?: PaginationMeta;
  statusCounts?: StatusCounts;
  searchParams: {
    search?: string;
    assigneeId?: string;
    status?: string;
    page?: string;
  };
}

/** 서버(byzip-sdk)와 동일한 상태값. 기본값 open */
export type StatusFilter = BugReportStatus;

// 내부에 저장되는 assignee id 목록 및 표시 이름
export const ASSIGNEES = [
  { id: 'psh5575', name: '박성환' },
  { id: 'heereal', name: '이희령' },
  { id: 'ys3', name: '정윤숙' },
] as const;
export type AssigneeId = (typeof ASSIGNEES)[number]['id'];

/** 드롭다운/서랍에서 표시할 상태 순서 (서버 enum 값 그대로 사용) */
export const STATUS_ORDER: BugReportStatus[] = [
  BugReportStatus.OPEN,
  BugReportStatus.IN_PROGRESS,
  BugReportStatus.RESOLVED,
  BugReportStatus.CLOSED,
];

/** 서버 상태값 → 한글 라벨 (UI 표시용) */
export const STATUS_LABEL: Record<BugReportStatus, string> = {
  [BugReportStatus.OPEN]: '해결필요',
  [BugReportStatus.IN_PROGRESS]: '해결중',
  [BugReportStatus.RESOLVED]: '해결완료',
  [BugReportStatus.CLOSED]: '버그아님',
};

export default function BugReportPage({
  initialBugs,
  initialMeta,
  statusCounts,
  searchParams,
}: BugReportClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useSearchParams();

  // 검색 입력값 (URL의 search 파라미터와 동기화)
  const [q, setQ] = useState(searchParams.search || '');

  // URL의 search 파라미터가 바뀌면 검색창 입력값 동기화
  useEffect(() => {
    setQ(searchParams.search || '');
  }, [searchParams.search]);

  const [selected, setSelected] = useState<BugReportDataDtoWithMemo | null>(
    null,
  );
  /** 서버와 동일한 BugReportStatus 사용 */
  const [detailStatus, setDetailStatus] = useState<BugReportStatus>(
    BugReportStatus.OPEN,
  );
  const [detailAssignee, setDetailAssignee] = useState<string | null>(null);
  const [detailMemo, setDetailMemo] = useState('');

  const [statusOpen, setStatusOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [statusActionOpen, setStatusActionOpen] = useState(false);
  const statusActionRef = useRef<HTMLDivElement>(null);
  const [isSearching, setIsSearching] = useState(false);

  // 담당자 필터 (URL의 assigneeId와 연동, API 호출 시 assigneeId param으로 전달)
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeId | 'all'>(
    () =>
      searchParams.assigneeId &&
        ASSIGNEES.some((a) => a.id === searchParams.assigneeId)
        ? (searchParams.assigneeId as AssigneeId)
        : 'all',
  );

  // URL의 assigneeId가 바뀌면 담당자 필터 상태 동기화 (예: 뒤로가기 시)
  useEffect(() => {
    setAssigneeFilter(
      searchParams.assigneeId &&
        ASSIGNEES.some((a) => a.id === searchParams.assigneeId)
        ? (searchParams.assigneeId as AssigneeId)
        : 'all',
    );
  }, [searchParams.assigneeId]);

  const [assigneeFilterOpen, setAssigneeFilterOpen] = useState(false);
  const assigneeFilterRef = useRef<HTMLTableCellElement>(null);
  const assigneeBtnRef = useRef<HTMLButtonElement>(null);
  const [assigneeMenuPos, setAssigneeMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const assigneeMenuRef = useRef<HTMLDivElement>(null);

  // 버그리포트 항목별 상세 내용 보여주는 창
  const [viewer, setViewer] = useState<{ title: string; text: string } | null>(
    null,
  );

  const [initialDetail, setInitialDetail] = useState<{
    status: BugReportStatus;
    assigneeId: string | null;
    memo: string;
  } | null>(null);

  // assignee id -> 한글 이름 매핑 (화면 표시용)
  const ASSIGNEE_ID_TO_NAME: Record<string, string> = {
    heereal: '이희령',
    psh5575: '박성환',
    ys3: '정윤숙',
  };

  const [isUpdating, setIsUpdating] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  /** 선택된 상태 필터. URL에 없으면 기본값 open */
  const statusFilter: StatusFilter =
    (searchParams.status as BugReportStatus) || BugReportStatus.OPEN;

  // 데이터 가공 (서버 status 그대로 사용, 포맷된 날짜만 추가)
  const processedBugs = useMemo(() => {
    return initialBugs.map((bug) => ({
      ...bug,
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
      const params = new URLSearchParams(searchParamsHook.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParamsHook],
  );

  const openViewer = (title: string, text: string | undefined) =>
    setViewer({ title, text: text || '' });

  // 페이지 변경 시 선택 항목 및 서랍 초기화
  useEffect(() => {
    setSelectedRowIds(new Set());
    setSelected(null);
  }, [searchParams.page]);

  // 검색 실행: URL에 search 파라미터로 반영 → 페이지 리렌더 시 API(getBugReports)가 search로 조회
  const handleSearch = () => {
    setIsSearching(true);
    try {
      updateUrl({ search: q || undefined, page: 1 });
    } finally {
      setIsSearching(false);
    }
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
    const status = Object.values(BugReportStatus).includes(
      bug.status as BugReportStatus,
    )
      ? (bug.status as BugReportStatus)
      : BugReportStatus.OPEN;
    setSelected(bug);
    setDetailStatus(status);
    setDetailAssignee(bug.assigneeId || null);
    setDetailMemo(bug.memo || '');
    setInitialDetail({
      status,
      assigneeId: bug.assigneeId || null,
      memo: bug.memo || '',
    });
    setStatusOpen(false);
    setAssigneeOpen(false);
  };

  const closeDrawer = () => setSelected(null);

  const handleSelectStatus = (status: BugReportStatus) => {
    setDetailStatus(status);
    setStatusOpen(false);
  };

  const handleSelectAssignee = (id: string | null) => {
    setDetailAssignee(id);
    setAssigneeOpen(false);
  };

  /** 같은 카드 재클릭 시 기본값(open)으로, 아니면 해당 상태로 필터 */
  const toggleFilter = (next: BugReportStatus) => {
    const newStatus: StatusFilter =
      statusFilter === next ? BugReportStatus.OPEN : next;
    updateUrl({ status: newStatus, page: 1 });
  };

  const handleToggleStatusAction = () => {
    if (!hasSelection) return;
    setStatusActionOpen((v) => !v);
  };

  // 선택된 리포트들에 대해 하나씩 PATCH 요청으로 상태를 갱신 (서버 상태값 그대로 전달)
  const handleBulkStatusSelect = async (status: BugReportStatus) => {
    if (isUpdating) return; // 이미 업데이트 중이면 무시
    if (!hasSelection) return; // 선택된 항목이 없으면 동작하지 않음

    setIsUpdating(true);
    const ids = Array.from(selectedRowIds);
    const errors: string[] = [];

    try {
      // 하나씩 순회하며 PATCH 호출을 수행합니다.
      for (const id of ids) {
        try {
          // updateBugReport는 서버의 PATCH /bug-reports/{id} 를 호출하도록 구현된 함수입니다.
          const res = await updateBugReport(
            id,
            { status },
            selected?.assigneeId || '',
          );
          // 각 호출의 성공 여부를 확인하여 실패한 경우 메시지를 수집합니다.
          if (!res.success) {
            errors.push(`id:${id} - ${res.message || '업데이트 실패'}`);
          }
        } catch (err) {
          // 네트워크 에러나 예외가 발생한 경우에도 계속 진행하되 에러 내용을 저장합니다.
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`id:${id} - ${msg}`);
        }
      }

      // 모든 항목 처리 후 결과에 따라 UI 갱신 또는 에러 알림
      if (errors.length === 0) {
        setStatusActionOpen(false);
        setSelectedRowIds(new Set());
        router.refresh(); // 데이터 새로고침
      } else {
        setAlertOpen(true);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setAlertOpen(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected || isUpdating) return;

    setIsUpdating(true);
    try {
      const result = await updateBugReport(
        selected.id,
        {
          status: detailStatus,
          // "미지정" 선택 시 null을 명시적으로 전달하여 DB에 null로 저장되도록 합니다.
          assigneeId:
            detailAssignee === null ? null : detailAssignee || undefined,
          memo: detailMemo,
        },
        // prevAssignee: 기존에 선택되어 있던 assignee id(없으면 빈 문자열)
        selected?.assigneeId ?? '',
      );

      if (result.success) {
        closeDrawer();
        router.refresh(); // 데이터 새로고침
      } else {
        setAlertOpen(true);
      }
    } catch (err) {
      console.error(err);
      setAlertOpen(true);
    } finally {
      setIsUpdating(false);
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

  // 서랍이 열려 있을 때 배경 스크롤 방지
  useEffect(() => {
    if (selected) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selected]);

  // 담당자 필터링 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideHeader =
        assigneeFilterRef.current && assigneeFilterRef.current.contains(target);
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

  return (
    <div className={styles.page}>
      {/* 상단 타이틀 */}
      <AdminPageHeader title="버그 리포트" />

      {/* 통계 카드 (서버 상태값 open / in_progress / resolved 로 필터) */}
      <section className={styles.stats}>
        {/* 해결 필요(open) 카드 */}
        <button
          type="button"
          className={`${styles.card} ${styles.cardButton} ${styles.yellow} ${statusFilter === BugReportStatus.OPEN ? styles.activeCard : ''
            }`}
          onClick={() => toggleFilter(BugReportStatus.OPEN)}
        >
          <div className={styles.cardLabel}>해결 필요</div>
          <div className={styles.cardNum}>
            {statusCounts !== undefined ? statusCounts.open : '-'}
          </div>
        </button>

        {/* 해결중인 버그(in_progress) 카드 */}
        <button
          type="button"
          className={`${styles.card} ${styles.cardButton} ${styles.mint} ${statusFilter === BugReportStatus.IN_PROGRESS
            ? styles.activeCard
            : ''
            }`}
          onClick={() => toggleFilter(BugReportStatus.IN_PROGRESS)}
        >
          <div className={styles.cardLabel}>해결중인 버그</div>
          <div className={styles.cardNum}>
            {statusCounts !== undefined ? statusCounts.in_progress : '-'}
          </div>
        </button>

        {/* 해결완료(resolved) 카드 */}
        <button
          type="button"
          className={`${styles.card} ${styles.cardButton} ${styles.purple} ${statusFilter === BugReportStatus.RESOLVED ? styles.activeCard : ''
            }`}
          onClick={() => toggleFilter(BugReportStatus.RESOLVED)}
        >
          <div className={styles.cardLabel}>해결완료</div>
          <div className={styles.cardNum}>
            {statusCounts !== undefined ? statusCounts.resolved : '-'}
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
          <button type="button" onClick={handleSearch} disabled={isSearching}>
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
                        const rect =
                          assigneeBtnRef.current.getBoundingClientRect();
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
                      <div className={styles.rowDetail}>{r.errorMessage}</div>
                    </td>
                    <td>{r.formattedDate}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${r.status === BugReportStatus.RESOLVED
                          ? styles.statusDone
                          : r.status === BugReportStatus.IN_PROGRESS
                            ? styles.statusProgress
                            : r.status === BugReportStatus.OPEN
                              ? styles.statusNeeded
                              : styles.statusNotBug
                          }`}
                      >
                        {STATUS_LABEL[r.status as BugReportStatus]}
                      </span>
                    </td>
                    <td className={styles.ellipsis}>{r.memo || ''}</td>
                    <td className={styles.assignee}>
                      {(() => {
                        const displayName = r.assigneeId
                          ? (ASSIGNEE_ID_TO_NAME[r.assigneeId] ?? r.assigneeId)
                          : '미지정';
                        const colorClass =
                          displayName === '미지정'
                            ? styles.assigneeGray
                            : displayName === '이희령'
                              ? styles.assigneePurple
                              : displayName === '정윤숙'
                                ? styles.assigneeBlue
                                : styles.assigneeGreen;
                        return (
                          <span
                            className={`${styles.assigneeBadge} ${colorClass}`}
                          >
                            {displayName}
                          </span>
                        );
                      })()}
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
                const currentPage = Number(searchParams.page) || 1;
                const startPage = Math.max(
                  1,
                  Math.min(currentPage - 4, initialMeta.totalPages - 9),
                );
                const p = startPage + i;
                if (p > initialMeta.totalPages) return null;
                return (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${p === currentPage ? styles.active : ''}`}
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
            {/* X 버튼(왼쪽)과 수정 완료 버튼(오른쪽)을 한 줄에 배치 */}
            <div className={styles.drawerHeader}>
              <button className={styles.drawerClose} onClick={closeDrawer}>
                ✕
              </button>
              <button
                className={styles.drawerSubmit}
                disabled={!hasDrawerChanges || isUpdating}
                onClick={handleUpdate}
              >
                {isUpdating ? <Spinner /> : '수정 완료'}
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
                            className={`${styles.selectOption} ${detailStatus === status ? styles.active : ''
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
                        {detailAssignee
                          ? ASSIGNEE_ID_TO_NAME[detailAssignee]
                          : '담당자 선택'}
                      </span>
                      <span className={styles.selectCaret}>▾</span>
                    </button>
                    {assigneeOpen && (
                      <div className={styles.selectMenu}>
                        <button
                          type="button"
                          className={`${styles.selectOption} ${detailAssignee === null ? styles.active : ''
                            }`}
                          onClick={() => handleSelectAssignee(null)}
                        >
                          미지정
                        </button>
                        {ASSIGNEES.map(({ id, name }) => (
                          <button
                            key={id}
                            type="button"
                            className={`${styles.selectOption} ${detailAssignee === id ? styles.active : ''
                              }`}
                            onClick={() => handleSelectAssignee(id)}
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
                <div className={styles.drawerSectionHeader}>
                  <h3 className={styles.drawerSectionTitle}>내용</h3>
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() => openViewer('내용', selected.errorMessage)}
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
                  <p className={styles.drawerParagraph}>
                    {selected.errorMessage}
                  </p>
                </div>
              </section>

              {/* 에러스택 */}
              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionHeader}>
                  <h3 className={styles.drawerSectionTitle}>에러스택</h3>
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() => openViewer('에러스택', selected.errorStack)}
                    aria-label="에러스택 자세히 보기"
                  >
                    ...
                  </button>
                </div>
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

              {/* 메타데이터 */}
              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionHeader}>
                  <h3 className={styles.drawerSectionTitle}>메타데이터</h3>
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() =>
                      openViewer(
                        '메타데이터',
                        JSON.stringify(selected.metadata, null, 2),
                      )
                    }
                    aria-label="메타데이터 자세히 보기"
                  >
                    ...
                  </button>
                </div>
                <div className={styles.drawerListBox}>
                  <pre style={{ fontSize: '11px', overflowX: 'auto' }}>
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
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
                    onClick={() => openViewer('에러발생위치 URL', selected.url)}
                    aria-label="에러발생위치 URL 자세히 보기"
                  >
                    ...
                  </button>
                </div>
                <div className={styles.drawerListBox}>
                  <div className={styles.drawerParagraph}>{selected.url}</div>
                </div>
              </section>

              {/* userAgent */}
              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionHeader}>
                  <h3 className={styles.drawerSectionTitle}>userAgent</h3>
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() => openViewer('userAgent', selected.userAgent)}
                    aria-label="userAgent 자세히 보기"
                  >
                    ...
                  </button>
                </div>
                <div className={styles.drawerListBox}>
                  <div className={styles.drawerParagraph}>
                    {selected.userAgent}
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
                  placeholder="메모를 입력해 주세요."
                />
              </section>
            </div>
          </aside>
        </>
      )}
      {/* 담당자 필터링 드롭다운 */}
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
            className={`${styles.assigneeOption} ${assigneeFilter === 'all' ? styles.active : ''
              }`}
            onClick={() => {
              setAssigneeFilter('all');
              setAssigneeFilterOpen(false);
              setAssigneeMenuPos(null);
              // 전체 선택 시 assigneeId 제거 후 1페이지로 이동 → API가 담당자 필터 없이 조회
              updateUrl({ assigneeId: undefined, page: 1 });
            }}
          >
            전체
          </button>
          {ASSIGNEES.map(({ id, name }) => (
            <button
              key={id}
              type="button"
              className={`${styles.assigneeOption} ${assigneeFilter === id ? styles.active : ''
                }`}
              onClick={() => {
                setAssigneeFilter(id);
                setAssigneeFilterOpen(false);
                setAssigneeMenuPos(null);
                // 담당자 선택 시 assigneeId로 URL 갱신 → 페이지 리렌더 시 API에 assigneeId param 전달
                updateUrl({ assigneeId: id, page: 1 });
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {/* 사이드바 항목 상세보기 뷰어 */}
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
      <Alert
        open={alertOpen}
        text="버그 리포트 수정에 실패했습니다. 다시 시도해 주세요."
        onConfirm={() => setAlertOpen(false)}
      />
    </div>
  );
}
