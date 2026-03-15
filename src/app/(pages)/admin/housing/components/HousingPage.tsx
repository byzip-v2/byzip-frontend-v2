'use client';

import { useEffect, useMemo, useState, useCallback, useTransition } from 'react';
import AdminPageHeader from '@/app/pub/admin/AdminPageHeader';
import Spinner from '@/app/components/common/Spinner/Spinner';
import PrimaryButton from '@/app/components/common/Button/PrimaryButton';
import styles from '@/styles/pages/admin/housing/housing.module.scss';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toggleHousingSupplyHidden, bulkHideHousingSupplies, bulkDeleteHousingSupplies, deleteHousingSupply, type GetHousingSuppliesResultData } from '../actions';
import { HousingSupplyDataDto } from 'byzip-v2-sdk';
import { useToast } from '@/app/libs/hooks/useToast';
import AlertModal from '@/app/libs/global-components/AlertModal';
import Pagination from '@/app/components/common/Pagination/Pagination';

type SaleRow = HousingSupplyDataDto & { isHidden?: boolean };

interface HousingClientProps {
  initialData: GetHousingSuppliesResultData;
  searchParams: {
    page?: string;
    search?: string;
    isHidden?: string;
    includeEnded?: string;
  };
}

export default function HousingClient({
  initialData,
  searchParams,
}: HousingClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const { showToast } = useToast();

  // 검색 입력값 (UI용)
  const [searchInput, setSearchInput] = useState(searchParams.search || '');

  // URL 파라미터가 바뀌면 입력값 동기화
  useEffect(() => {
    setSearchInput(searchParams.search || '');
  }, [searchParams.search]);

  // 체크박스 선택 상태
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<number>>(
    new Set(),
  );

  const [selected, setSelected] = useState<SaleRow | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // URL 업데이트 유틸리티
  const updateUrl = useCallback(
    (updates: Record<string, string | number | boolean | undefined>) => {
      const params = new URLSearchParams(searchParamsHook.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === false) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParamsHook],
  );

  // API 데이터 상태 동기화
  const list = initialData.items;
  const total = initialData.meta.total;
  const totalPages = initialData.meta.totalPages || 1;
  const currentPage = initialData.meta.page || 1;

  const toggleEnded = searchParams.includeEnded === 'true';
  const toggleHidden = searchParams.isHidden === 'true';

  const isLoading = isPending;


  // 데이터 갱신이 필요할 때만 fetchList 사용 (숨김 토글, 삭제 등 액션 후)
  const fetchList = useCallback(async () => {
    router.refresh(); // 서버 컴포넌트 재실행을 통한 최신화
  }, [router]);

  // 확인 모달 상태
  const [confirmModal, setConfirmModal] = useState<'hide' | 'delete' | 'deleteOne' | null>(null);

  // 페이지 이동 시 선택 초기화
  useEffect(() => {
    setSelectedRowKeys(new Set());
  }, [currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      updateUrl({ page: totalPages });
    }
  }, [currentPage, totalPages, updateUrl]);

  // 체크박스 전체 선택
  const visibleRowKeys = useMemo(
    () => list.map((item) => item.id),
    [list],
  );

  // 전체 체크박스 상태
  const allVisibleSelected = visibleRowKeys.length > 0 && visibleRowKeys.every((key) =>
    selectedRowKeys.has(key),
  );

  // 체크박스 전체 선택 토글
  const handleToggleAll = (checked: boolean) => {
    const next = new Set(selectedRowKeys);
    if (checked) {
      visibleRowKeys.forEach((k) => next.add(k));
    } else {
      visibleRowKeys.forEach((k) => next.delete(k));
    }
    setSelectedRowKeys(next);
  };

  const handleToggleRow = (key: number, checked: boolean) => {
    const next = new Set(selectedRowKeys);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    setSelectedRowKeys(next);
  };

  const handleSearch = () => {
    updateUrl({ search: searchInput || undefined, page: 1 });
  };

  const handleRowClick = (row: SaleRow) => {
    setSelected(row);
  };

  const handleToggleHiddenItem = async (id: number, currentHidden: boolean) => {
    try {
      const result = await toggleHousingSupplyHidden(id, !currentHidden);
      if (result.success) {
        showToast('숨김 상태가 변경되었습니다.');
        fetchList();
        if (selected?.id === id) {
          setSelected(result.data!);
        }
      } else {
        showToast(result.message, 'error');
      }
    } catch {
      showToast('상태 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  const closeDrawer = () => setSelected(null);

  // 선택한 공고 일괄 숨김 처리
  const handleBulkHide = async () => {
    if (selectedRowKeys.size === 0) return;
    setConfirmModal(null); // 모달 닫기

    setIsActionLoading(true);
    try {
      const ids = Array.from(selectedRowKeys);
      const result = await bulkHideHousingSupplies(ids, true);
      if (result.success) {
        showToast(result.message);
        setSelectedRowKeys(new Set());
        // 선택된 서랍 항목이 숨김 처리된 경우 서랍 닫기
        if (selected && selectedRowKeys.has(selected.id)) {
          setSelected(null);
        }
        await fetchList();
      } else {
        showToast(result.message, 'error');
      }
    } catch {
      showToast('일괄 숨김 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 선택한 공고 일괄 삭제 처리
  const handleBulkDelete = async () => {
    if (selectedRowKeys.size === 0) return;
    setConfirmModal(null); // 모달 닫기

    setIsActionLoading(true);
    try {
      const ids = Array.from(selectedRowKeys);
      const result = await bulkDeleteHousingSupplies(ids);
      if (result.success) {
        showToast(result.message);
        setSelectedRowKeys(new Set());
        // 삭제된 항목이 서랍에 열려있으면 닫기
        if (selected && selectedRowKeys.has(selected.id)) {
          setSelected(null);
        }
        await fetchList();
      } else {
        showToast(result.message, 'error');
      }
    } catch {
      showToast('일괄 삭제 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 드로어에서 단건 공고 삭제 처리
  const handleDeleteOne = async () => {
    if (!selected) return;
    setConfirmModal(null); // 모달 닫기

    setIsActionLoading(true);
    try {
      const result = await deleteHousingSupply(selected.id);
      if (result.success) {
        showToast(result.message);
        setSelected(null);          // 서랍 닫기
        await fetchList();           // 목록 새로고침
      } else {
        showToast(result.message, 'error');
      }
    } catch {
      showToast('공고 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 공고 상태(Status) 계산
  const getStatus = (row: SaleRow) => {
    const now = new Date();

    // 시작일 후보: 특별공급 시작일, 일반공급 시작일
    const startDates = [row.spsplyRceptBgnde, row.rceptBgnde]
      .filter(Boolean)
      .map((d) => new Date(d!));

    // 종료일 후보: 특별공급 종료일, 일반공급 종료일
    const endDates = [row.spsplyRceptEndde, row.rceptEndde]
      .filter(Boolean)
      .map((d) => new Date(d!));

    // 날짜 정보가 하나도 없는 경우
    if (startDates.length === 0 || endDates.length === 0) {
      return { label: '상태미정', class: styles.statusDone };
    }

    // 전체 청약 기간: 가장 빠른 시작일 ~ 가장 늦은 종료일
    const minStart = new Date(Math.min(...startDates.map((d) => d.getTime())));
    const maxEnd = new Date(Math.max(...endDates.map((d) => d.getTime())));

    if (now < minStart) {
      return { label: '청약예정', class: styles.statusPending };
    }
    if (now <= maxEnd) {
      return { label: '청약가능', class: styles.statusOk };
    }
    return { label: '청약종료', class: styles.statusDone };
  };

  const formatDateString = (dateStr?: string | Date) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    } catch {
      return '-';
    }
  };

  // 전화번호 포맷팅 (하이픈 추가)
  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/[^0-9]/g, '');

    if (cleaned.length === 8) {
      return cleaned.replace(/(\d{4})(\d{4})/, '$1-$2');
    }
    if (cleaned.startsWith('02')) {
      if (cleaned.length === 9) return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
      if (cleaned.length === 10) return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return phone;
  };

  return (
    <div className={styles.page}>
      <AdminPageHeader title="분양공고 관리" />

      <div className={styles.toolbar}>
        <div className={styles.total}>
          총 <span className={styles.totalNum}>{total}</span>건
        </div>
        <div className={styles.toggles}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={toggleEnded}
              onChange={(e) => {
                updateUrl({ includeEnded: e.target.checked, page: 1 });
              }}
            />
            <span>종료된 공고 포함</span>
            <span className={styles.toggleSwitch} aria-hidden />
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={toggleHidden}
              onChange={(e) => {
                updateUrl({ isHidden: e.target.checked, page: 1 });
              }}
            />
            <span>숨겨진 공고 포함</span>
            <span className={styles.toggleSwitch} aria-hidden />
          </label>
        </div>
        <div className={styles.searchWrap}>
          <input
            placeholder="공고명 또는 공급 위치를 입력해 주세요."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
          <PrimaryButton
            onClick={handleSearch}
            isLoading={isLoading}
          >
            검색
          </PrimaryButton>
          <button
            type="button"
            className={styles.subAction}
            disabled={!selectedRowKeys.size || isActionLoading}
            onClick={() => setConfirmModal('hide')}
          >
            {isActionLoading ? <Spinner /> : `선택 숨김${selectedRowKeys.size > 0 ? ` (${selectedRowKeys.size})` : ''}`}
          </button>
          <button
            type="button"
            className={`${styles.subAction} ${styles.danger}`}
            disabled={!selectedRowKeys.size || isActionLoading}
            onClick={() => setConfirmModal('delete')}
          >
            {isActionLoading ? <Spinner /> : `선택 삭제${selectedRowKeys.size > 0 ? ` (${selectedRowKeys.size})` : ''}`}
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(e) => handleToggleAll(e.target.checked)}
                />
              </th>
              <th>분양공고명</th>
              <th>공급 위치</th>
              <th>모집 공고일</th>
              <th>지역</th>
              <th>분양유형</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => {
              const checked = selectedRowKeys.has(row.id);
              const status = getStatus(row);
              return (
                <tr
                  key={row.id}
                  className={selected?.id === row.id ? styles.rowSelected : ''}
                  onClick={() => handleRowClick(row)}
                >
                  <td className={styles.checkCell}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleToggleRow(row.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td>
                    <div className={styles.rowTitle}>{row.houseName}</div>
                  </td>
                  <td>
                    <div className={styles.ellipsis}>{row.hssplyAdres || '-'}</div>
                  </td>
                  <td>{formatDateString(row.rcritPblancDe)}</td>
                  <td>{row.subscrptAreaCodeNm}</td>
                  <td>{row.houseSecdNm}</td>
                  <td>
                    <span className={`${styles.badge} ${status.class}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                  공고가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => updateUrl({ page })}
        hasData={list.length > 0}
      />

      {selected && (
        <>
          <div className={styles.drawerBackdrop} onClick={closeDrawer} />
          <aside className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <button className={styles.drawerClose} onClick={closeDrawer}>
                ✕
              </button>
              <div className={styles.drawerActions}>
                <button
                  className={`${styles.drawerBtn} ${styles.secondary}`}
                  disabled={isActionLoading}
                  onClick={() => setConfirmModal('deleteOne')}
                >
                  삭제
                </button>
              </div>
            </div>

            <div className={styles.drawerBody}>
              <h2 className={styles.drawerTitle}>{selected.houseName}</h2>

              <div className={styles.drawerRow}>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>분양형태</label>
                  <input
                    className={styles.readonlyInput}
                    value={selected.houseSecdNm || '-'}
                    readOnly
                  />
                </div>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>숨김여부</label>
                  <div className={styles.toggleInline}>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={selected.isHidden}
                        onChange={() =>
                          handleToggleHiddenItem(selected.id, !!selected.isHidden)
                        }
                      />
                      <span className={styles.toggleSwitch} aria-hidden />
                    </label>
                  </div>
                </div>
              </div>

              <section className={styles.drawerSection}>
                <h3 className={styles.drawerSectionTitle}>입주자 모집공고 주요정보</h3>
                <div className={styles.drawerRow}>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>공급위치</label>
                    <textarea
                      className={styles.drawerTextarea}
                      value={selected.hssplyAdres || '-'}
                      readOnly
                    />
                  </div>
                </div>
                <div className={styles.drawerRow}>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>공급규모</label>
                    <input
                      className={styles.readonlyInput}
                      value={`${selected.totSuplyHshldco || 0}세대`}
                      readOnly
                    />
                  </div>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>관련문의</label>
                    <input
                      className={styles.readonlyInput}
                      value={selected.bsnsMbyNm || '-'}
                      readOnly
                    />
                  </div>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>문의처</label>
                    <input
                      className={styles.readonlyInput}
                      value={formatPhoneNumber(selected.mdhsTelno)}
                      readOnly
                    />
                  </div>
                </div>
              </section>

              <section className={styles.drawerSection}>
                <h3 className={styles.drawerSectionTitle}>공급일정</h3>
                <div className={styles.drawerRow}>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>모집 공고일</label>
                    <input
                      className={styles.readonlyInput}
                      value={formatDateString(selected.rcritPblancDe)}
                      readOnly
                    />
                  </div>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>당첨자 발표일</label>
                    <input
                      className={styles.readonlyInput}
                      value={formatDateString(selected.przwnerPresnatnDe)}
                      readOnly
                    />
                  </div>
                </div>
                <div className={styles.drawerRow}>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>청약 접수 기간</label>
                    <input
                      className={styles.readonlyInput}
                      value={`${formatDateString(selected.rceptBgnde)} ~ ${formatDateString(selected.rceptEndde)}`}
                      readOnly
                    />
                  </div>
                </div>
              </section>

              <section className={styles.drawerSection}>
                <h3 className={styles.drawerSectionTitle}>기타 정보</h3>
                <div className={styles.drawerRow}>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>공고문 링크</label>
                    <a
                      href={selected.pblancUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkText}
                    >
                      {selected.pblancUrl || '링크 없음'}
                    </a>
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </>
      )}
      {/* 선택 숨김 확인 모달 */}
      {confirmModal === 'hide' && (
        <AlertModal
          message={`선택한 ${selectedRowKeys.size}건을 숨김 처리하시겠습니까?`}
          confirmLabel="숨김 처리"
          cancelLabel="취소"
          onConfirm={handleBulkHide}
          onClose={() => setConfirmModal(null)}
        />
      )}
      {/* 선택 삭제 확인 모달 */}
      {confirmModal === 'delete' && (
        <AlertModal
          message={`선택한 ${selectedRowKeys.size}건을 삭제하시겠습니까?`}
          confirmLabel="삭제"
          cancelLabel="취소"
          danger
          onConfirm={handleBulkDelete}
          onClose={() => setConfirmModal(null)}
        />
      )}
      {/* 단건 삭제 확인 모달 */}
      {confirmModal === 'deleteOne' && selected && (
        <AlertModal
          message={`'${selected.houseName}' 공고를 삭제하시겠습니까?`}
          confirmLabel="삭제"
          cancelLabel="취소"
          danger
          onConfirm={handleDeleteOne}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
