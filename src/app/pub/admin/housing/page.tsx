'use client';

import { useMemo, useState } from 'react';
import AdminPageHeader from '@/app/pub/admin/AdminPageHeader';
import Spinner from '@/app/components/common/Spinner/Spinner';
import styles from '@/styles/pages/admin/housing/housing.module.scss';

type SaleStatus = '청약가능' | '청약예정' | '무순위' | '청약종료';
type SaleType = '영구임대' | '국민임대' | '행복주택';

type SaleRow = {
  id: string;
  title: string;
  supplyLocation: string;
  region: string;
  saleType: SaleType;
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
    saleType: '영구임대',
    status: '청약가능',
    registeredAt: '2025-01-30',
    detail:
      '신청자 모임 공고와 분양 구조 정보가 포함된 예시 텍스트입니다. 길이가 길어도 스크롤 내에서 처리됩니다.',
    contactName: '김담당',
    contactPhone: '1800-1004',
  },
  {
    id: 'sale-2',
    title: '고양장항지구 S-1블록 공공분양주택 (본청약)',
    supplyLocation: '경기도 고양시 일산동구 정발산동, 일산서구 대화동 일원',
    region: '경기',
    saleType: '국민임대',
    status: '청약가능',
    registeredAt: '2025-01-30',
    detail:
      '고양장항지구 S-1블록 공공분양주택 (본청약) 안내에 대한 더미 데이터입니다.',
    contactName: '박성환',
    contactPhone: '02-555-1234',
  },
  {
    id: 'sale-3',
    title: '고양장항지구 S-1블록 공공분양주택 (본청약)',
    supplyLocation: '경기도 고양시 일산동구 정발산동, 일산서구 대화동 일원',
    region: '경기',
    saleType: '행복주택',
    status: '청약예정',
    registeredAt: '2025-01-30',
    detail:
      '고양장항지구 S-1블록 공공분양주택 (본청약) 안내에 대한 더미 데이터입니다.',
    contactName: '이희령',
    contactPhone: '051-222-3333',
  },
  {
    id: 'sale-4',
    title: '고양장항지구 S-1블록 공공분양주택 (본청약)',
    supplyLocation: '경기도 고양시 일산동구 정발산동, 일산서구 대화동 일원',
    region: '경기',
    saleType: '영구임대',
    status: '무순위',
    registeredAt: '2025-01-30',
    detail:
      '고양장항지구 S-1블록 공공분양주택 (본청약) 안내에 대한 더미 데이터입니다.',
    contactName: '정윤숙',
    contactPhone: '031-000-1234',
  },
  {
    id: 'sale-5',
    title: '고양장항지구 S-1블록 공공분양주택 (본청약)',
    supplyLocation: '경기도 고양시 일산동구 정발산동, 일산서구 대화동 일원',
    region: '경기',
    saleType: '영구임대',
    status: '청약종료',
    registeredAt: '2025-01-30',
    detail:
      '고양장항지구 S-1블록 공공분양주택 (본청약) 안내에 대한 더미 데이터입니다.',
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
      case '청약가능':
        return styles.statusOk;
      case '청약예정':
        return styles.statusPending;
      case '무순위':
        return styles.statusSub;
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
            placeholder="공고명 또는 공급 위치를 입력해 주세요."
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
                  <td>{row.registeredAt}</td>
                  <td>{row.region}</td>
                  <td>{row.saleType}</td>
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
                  <label className={styles.drawerLabel}>분양형태</label>
                  <input
                    className={styles.readonlyInput}
                    value={selected.saleType}
                    readOnly
                  />
                </div>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>숨김여부</label>
                  <div className={styles.toggleInline}>
                    <label className={styles.toggle}>
                      <input type="checkbox" defaultChecked />
                      <span className={styles.toggleSwitch} aria-hidden />
                    </label>
                  </div>
                </div>
              </div>

              <section className={styles.drawerSection}>
                <h3 className={styles.drawerSectionTitle}>입주자 모집공고 주요정보</h3>
                <div className={styles.drawerRow}>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>공고위치</label>
                    <textarea
                      className={styles.drawerTextarea}
                      value="경기도 고양시 일산동구 정발산동, 일산서구 대화동 일원"
                      readOnly
                    />
                  </div>
                </div>
                <div className={styles.drawerRow}>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>공급규모</label>
                    <input className={styles.readonlyInput} value="341세대" readOnly />
                  </div>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>관련문의</label>
                    <input
                      className={styles.readonlyInput}
                      value="사업주체 또는 분양사무실로 문의"
                      readOnly
                    />
                  </div>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>문의처</label>
                    <input className={styles.readonlyInput} value="1600-1004" readOnly />
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
                      value="2025-01-30"
                      readOnly
                    />
                  </div>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>당첨자 발표일</label>
                    <input
                      className={styles.readonlyInput}
                      value="2025-01-30"
                      readOnly
                    />
                  </div>
                </div>
                <div className={styles.drawerRow}>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>서류 접수 기간</label>
                    <input
                      className={styles.readonlyInput}
                      value="2024-10-14 ~ 2025-09-30"
                      readOnly
                    />
                  </div>
                </div>
              </section>

              <section className={styles.drawerSection}>
                <h3 className={styles.drawerSectionTitle}>유의 사항</h3>
                <div className={styles.drawerRow}>
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>모집 공고문</label>
                    <textarea
                      className={styles.drawerTextarea}
                      value="* 삼척호연 모집계약용 흙 45M2 / 삼척지구 모집계약용 59m2로 모집마감 되었습니다. * 임대전용의 임대보증금 및 임대료는 입주전환용주택공급규정(2024.01.09) 변경기준에 따라, 예비입주자 선정시 고지예정된 임대 계약을 체결하는 시점이 당해 주택 입주일 이전일 경우에는 변경된 임대보증금으로 계약하셔야 합니다. ※ 모집공고문에 모든 내용이 포함되어 있으니 반드시 자세히 신청하시길 바랍니다. (첨부된 모집 공고문에는 신청인 본인이 확인하였습니다.) ※ 특히 임대전용주택공급시사업계획 승인업이상이며, 반드시 모집공고 수신자에게 해당 신청접수만의 접수주소를 확인하여 접수해야 주시기 바랍니다. ※ 모집일정 중복시 조기마감 될 수 있습니다."
                      readOnly
                    />
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
