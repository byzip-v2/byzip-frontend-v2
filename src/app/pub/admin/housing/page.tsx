'use client';

import { useMemo, useState } from 'react';
import AdminPageHeader from '@/app/pub/admin/AdminPageHeader';
import Spinner from '@/app/components/common/Spinner/Spinner';
import styles from '@/styles/pages/admin/housing/housing.module.scss';

type SaleStatus = '승인가능' | '승인불가' | '승인요청' | '종료';

type SaleRow = {
  id: string;
  title: string;
  supplyLocation: string;
  region: string;
  saleType: string;
  status: SaleStatus;
  registeredAt: string;
  detail: string;
  contactName: string;
  contactPhone: string;
};

const SALE_MOCK: SaleRow[] = [
  {
    id: 'sale-1',
    title: '고양장항지구 S-1블록 공공분양주택 (본청약)',
    supplyLocation: '경기도 고양시 일산동구 정발산동, 일산서구 대화동 일원',
    region: '경기',
    saleType: '공공분양',
    status: '승인가능',
    registeredAt: '2025-03-20',
    detail:
      '신청자 모임 공고와 분양 구조 정보가 포함된 예시 텍스트입니다. 길이가 길어도 스크롤 내에서 처리됩니다.',
    contactName: '김담당',
    contactPhone: '1800-1004',
  },
  {
    id: 'sale-2',
    title: '서울 마포구 재개발 구역 임대주택',
    supplyLocation: '서울특별시 마포구 연남동 일원',
    region: '서울',
    saleType: '공공임대',
    status: '승인요청',
    registeredAt: '2025-03-15',
    detail: '서울 마포구 재개발 구역 임대주택 공고입니다.',
    contactName: '박성환',
    contactPhone: '02-555-1234',
  },
  {
    id: 'sale-3',
    title: '부산 해운대 공동주택 분양',
    supplyLocation: '부산 해운대구 좌동',
    region: '부산',
    saleType: '민영분양',
    status: '승인불가',
    registeredAt: '2025-03-12',
    detail: '부산 해운대 공동주택 분양 안내입니다.',
    contactName: '이희령',
    contactPhone: '051-222-3333',
  },
  {
    id: 'sale-4',
    title: '성남 판교 테크노밸리 오피스텔',
    supplyLocation: '경기도 성남시 수정구 판교 일원',
    region: '경기',
    saleType: '오피스텔',
    status: '승인가능',
    registeredAt: '2025-03-10',
    detail: '판교 테크노밸리 오피스텔 분양 공고입니다.',
    contactName: '정윤숙',
    contactPhone: '031-000-1234',
  },
  {
    id: 'sale-5',
    title: '대전 둔산동 공공분양주택',
    supplyLocation: '대전광역시 서구 둔산동',
    region: '대전',
    saleType: '공공분양',
    status: '종료',
    registeredAt: '2025-03-01',
    detail: '대전 둔산동 공공분양주택 공고입니다.',
    contactName: '조연락',
    contactPhone: '042-987-6543',
  },
];

export default function SaleManagePage() {
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(
    new Set(),
  );
  const [selected, setSelected] = useState<SaleRow | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [toggleEnded, setToggleEnded] = useState(false);
  const [toggleHidden, setToggleHidden] = useState(false);

  const list = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return SALE_MOCK;
    return SALE_MOCK.filter(
      (item) =>
        item.title.toLowerCase().includes(keyword) ||
        item.supplyLocation.toLowerCase().includes(keyword) ||
        item.saleType.toLowerCase().includes(keyword),
    );
  }, [q]);

  const visibleRowKeys = useMemo(
    () => list.map((item) => item.id),
    [list],
  );
  const allVisibleSelected = visibleRowKeys.every((key) =>
    selectedRowKeys.has(key),
  );

  const handleToggleAll = (checked: boolean) => {
    const next = new Set(selectedRowKeys);
    if (checked) {
      visibleRowKeys.forEach((k) => next.add(k));
    } else {
      visibleRowKeys.forEach((k) => next.delete(k));
    }
    setSelectedRowKeys(next);
  };

  const handleToggleRow = (key: string, checked: boolean) => {
    const next = new Set(selectedRowKeys);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    setSelectedRowKeys(next);
  };

  const handleSearch = async () => {
    setQ(searchInput);
    setIsSearching(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsSearching(false);
  };

  const handleRowClick = (row: SaleRow) => {
    setSelected(row);
  };

  const closeDrawer = () => setSelected(null);

  const statusClass = (status: SaleStatus) => {
    switch (status) {
      case '승인가능':
        return styles.statusOk;
      case '승인불가':
        return styles.statusBad;
      case '승인요청':
        return styles.statusPending;
      default:
        return styles.statusDone;
    }
  };

  return (
    <div className={styles.page}>
      <AdminPageHeader title="분양공고 관리" />

      <div className={styles.toolbar}>
        <div className={styles.total}>
          총 <span className={styles.totalNum}>{SALE_MOCK.length}</span>건
        </div>
        <div className={styles.toggles}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={toggleEnded}
              onChange={(e) => setToggleEnded(e.target.checked)}
            />
            <span>종료된 공고 포함</span>
            <span className={styles.toggleSwitch} aria-hidden />
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={toggleHidden}
              onChange={(e) => setToggleHidden(e.target.checked)}
            />
            <span>숨겨진 공고 포함</span>
            <span className={styles.toggleSwitch} aria-hidden />
          </label>
        </div>
        <div className={styles.searchWrap}>
          <input
            placeholder="검색어를 입력해 주세요."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Spinner /> : '검색'}
          </button>
          <button
            type="button"
            className={styles.subAction}
            disabled={!selectedRowKeys.size}
          >
            선택 숨김
          </button>
          <button
            type="button"
            className={`${styles.subAction} ${styles.danger}`}
            disabled={!selectedRowKeys.size}
          >
            선택 삭제
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
              <th style={{ width: 420 }}>분양공고명</th>
              <th style={{ width: 220 }}>공급 위치</th>
              <th style={{ width: 120 }}>지역</th>
              <th style={{ width: 140 }}>분양유형</th>
              <th style={{ width: 140 }}>등록일</th>
              <th style={{ width: 120 }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => {
              const checked = selectedRowKeys.has(row.id);
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
                    <div className={styles.rowTitle}>{row.title}</div>
                  </td>
                  <td className={styles.ellipsis}>{row.supplyLocation}</td>
                  <td>{row.region}</td>
                  <td>{row.saleType}</td>
                  <td>{row.registeredAt}</td>
                  <td>
                    <span className={`${styles.badge} ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.paging}>
        <button className={styles.arrow}>{'<'}</button>
        {[1, 2, 3, 4, 10, 11].map((n) => (
          <button
            key={n}
            className={`${styles.pageBtn} ${n === 1 ? styles.active : ''}`}
          >
            {n}
          </button>
        ))}
        <button className={styles.arrow}>{'>'}</button>
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
                <button className={`${styles.drawerBtn} ${styles.secondary}`}>
                  삭제
                </button>
                <button className={styles.drawerBtn}>저장</button>
              </div>
            </div>

            <div className={styles.drawerBody}>
              <h2 className={styles.drawerTitle}>{selected.title}</h2>

              <div className={styles.drawerRow}>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>노출 상태</label>
                  <label className={styles.toggle}>
                    <input type="checkbox" defaultChecked />
                    <span>노출</span>
                  </label>
                </div>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>분양유형</label>
                  <input
                    className={styles.readonlyInput}
                    value={selected.saleType}
                    readOnly
                  />
                </div>
              </div>

              <div className={styles.drawerRow}>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>입주자 모집공고 주요정보</label>
                  <textarea
                    className={styles.drawerTextarea}
                    value={selected.detail}
                    readOnly
                  />
                </div>
              </div>

              <div className={styles.drawerRow}>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>모집구분</label>
                  <input
                    className={styles.readonlyInput}
                    value="국민주택"
                    readOnly
                  />
                </div>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>모집대상</label>
                  <input
                    className={styles.readonlyInput}
                    value="신혼부부"
                    readOnly
                  />
                </div>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>공급형태</label>
                  <input
                    className={styles.readonlyInput}
                    value="공공분양"
                    readOnly
                  />
                </div>
              </div>

              <div className={styles.drawerRow}>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>공급규모</label>
                  <input className={styles.readonlyInput} value="34세대" readOnly />
                </div>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>담당자 연락처</label>
                  <input
                    className={styles.readonlyInput}
                    value={selected.contactPhone}
                    readOnly
                  />
                </div>
              </div>

              <div className={styles.drawerRow}>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>모집기간</label>
                  <input
                    className={styles.readonlyInput}
                    value="2025-03-20 ~ 2025-03-30"
                    readOnly
                  />
                </div>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>지역</label>
                  <input
                    className={styles.readonlyInput}
                    value={selected.region}
                    readOnly
                  />
                </div>
              </div>

              <div className={styles.drawerRow}>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>유의사항</label>
                  <textarea
                    className={styles.drawerTextarea}
                    value="모집공고 요약 내용이 들어가는 자리입니다. 길어질 경우 스크롤로 확인 가능합니다."
                    readOnly
                  />
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
