'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import AdminPageHeader from '@/app/pub/admin/AdminPageHeader';
import Spinner from '@/app/components/common/Spinner/Spinner';
import styles from '@/styles/pages/admin/housing/housing.module.scss';
import { getHousingSupplies, toggleHousingSupplyHidden, bulkHideHousingSupplies, bulkDeleteHousingSupplies, deleteHousingSupply, type GetHousingSuppliesResultData } from '../actions';
import { HousingSupplyDataDto } from 'byzip-v2-sdk';
import { useToast } from '@/app/libs/hooks/useToast';
import AlertModal from '@/app/libs/global-components/AlertModal';

type SaleRow = HousingSupplyDataDto & { isHidden?: boolean };

interface HousingClientProps {
  initialData: GetHousingSuppliesResultData;
}

export default function HousingClient({ initialData }: HousingClientProps) {
  const { showToast } = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<number>>(
    new Set(),
  );

  const [selected, setSelected] = useState<SaleRow | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 초기값 false로 변경 (SSR 데이터 있음)
  const [isActionLoading, setIsActionLoading] = useState(false); // 일괄 액션 입력 주여부
  const [toggleEnded, setToggleEnded] = useState(false); // 종료된 공고 포함 여부
  const [toggleHidden, setToggleHidden] = useState(false);

  // 확인 모달 상태
  // null: 모달 닫힌
  // 'hide': 일괄 숨김 확인
  // 'delete': 일괄 삭제 확인
  // 'deleteOne': 단건 삭제 확인
  const [confirmModal, setConfirmModal] = useState<'hide' | 'delete' | 'deleteOne' | null>(null);

  // API 데이터 상태
  const [list, setList] = useState<SaleRow[]>(initialData.items);
  const [total, setTotal] = useState(initialData.meta.total);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // 첫 마운트 여부 확인용 (최초 SSR 데이터 로드 후 중복 fetch 방지)
  const isMounted = useRef(false);

  // 분양공고 목록 조회 API 호출
  const fetchList = useCallback(async () => {
    // 마운트 직후 최초 호출은 SSR 데이터가 있으므로 스킵 (단, 검색어나 필터가 변경된 경우는 제외)
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    setIsLoading(true);
    try {
      // toggleEnded가 false이면 오늘 이후에 종료되는 공고만 조회 (종료된 공고 제외)
      // toggleEnded가 true이면 rceptEnddeFrom 파라미터를 생략 → 모든 공고 조회
      const today = new Date().toISOString().split('T')[0];

      const result = await getHousingSupplies({
        search: q || undefined,
        isHidden: toggleHidden,
        page: currentPage,
        limit,
        // 종료된 공고 제외: 청약 접수 종료일이 오늘 이후인 것만 조회
        rcritPblancDeFrom: !toggleEnded ? today : undefined,
      });

      if (result.success && result.data) {
        const { items, meta } = result.data as GetHousingSuppliesResultData;
        setList(items || []);
        setTotal(meta?.total || 0);
      } else {
        showToast(result.message, 'error');
      }
    } catch {
      showToast('데이터를 가져오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [q, toggleEnded, toggleHidden, currentPage, showToast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

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

  const handleSearch = async () => {
    setIsSearching(true);
    setQ(searchInput);
    setCurrentPage(1);
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
      return `${year}-${month}-${day}`;
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
                setToggleEnded(e.target.checked);
                setCurrentPage(1);
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
                setToggleHidden(e.target.checked);
                setCurrentPage(1);
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
          <button className={styles.searchBtn} onClick={handleSearch} disabled={isSearching || isLoading}>
            {isSearching || isLoading ? <Spinner /> : '검색'}
          </button>
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
              <th style={{ width: 60 }}>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(e) => handleToggleAll(e.target.checked)}
                />
              </th>
              <th style={{ width: 280 }}>분양공고명</th>
              <th style={{ width: 360 }}>공급 위치</th>
              <th style={{ width: 140 }}>모집 공고일</th>
              <th style={{ width: 110 }}>지역</th>
              <th style={{ width: 140 }}>분양유형</th>
              <th style={{ width: 110 }}>상태</th>
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
                  <td className={styles.ellipsis}>{row.hssplyAdres}</td>
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

      <div className={styles.paging}>
        <button
          className={styles.arrow}
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        >
          {'<'}
        </button>
        {Array.from({ length: Math.min(5, Math.ceil(total / limit)) }).map(
          (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                className={`${styles.pageBtn} ${pageNum === currentPage ? styles.active : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          },
        )}
        <button
          className={styles.arrow}
          disabled={currentPage >= Math.ceil(total / limit)}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          {'>'}
        </button>
      </div>

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
                <button className={styles.drawerBtn}>저장</button>
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
