'use client';

import { useMemo, useState } from 'react';
import styles from '@/styles/pages/admin/bug/bug.module.scss';

type BugStatus = 'open' | 'progress' | 'need-fix' | 'done';

type BugRow = {
  id: string;
  title: string;     // 짧은 제목 (ex. 500 - Internal Server Error)
  detail: string;    // 한 줄 설명
  count: number;     // 발생 횟수
  status: BugStatus; // 상태
  memo: string;      // 메모
  highlight?: boolean;
};

const MOCK: BugRow[] = [
  {
    id: 'uuid',
    title: '500 - Internal Server Error',
    detail: 'The server encountered an internal e...',
    count: 12,
    status: 'done',
    memo: '메인 페이지 속도 저하 원인...',
    highlight: true,
  },
  { id: 'uuid', title: '500 - Internal Server Error', detail: 'The server encountered an internal e...', count: 8, status: 'progress', memo: '메인 페이지 속도 저하 원인...' },
  { id: 'uuid', title: '500 - Internal Server Error', detail: 'The server encountered an internal e...', count: 7, status: 'need-fix', memo: '메인 페이지 속도 저하 원인...' },
  { id: 'uuid', title: '500 - Internal Server Error', detail: 'The server encountered an internal e...', count: 4, status: 'open', memo: '메인 페이지 속도 저하 원인...' },
  { id: 'uuid', title: '500 - Internal Server Error', detail: 'The server encountered an internal e...', count: 4, status: 'done', memo: '메인 페이지 속도 저하 원인...' },
  { id: 'uuid', title: '500 - Internal Server Error', detail: 'The server encountered an internal e...', count: 2, status: 'done', memo: '메인 페이지 속도 저하 원인...' },
  { id: 'uuid', title: '500 - Internal Server Error', detail: 'The server encountered an internal e...', count: 1, status: 'done', memo: '메인 페이지 속도 저하 원인...' },
];

const STATUS_LABEL: Record<BugStatus, string> = {
  open: '확인 필요',
  'need-fix': '개발중',
  progress: '해결중',
  done: '확인 완료',
};

// 디테일 영역에 뿌릴 더미 발생일
const MOCK_OCCURS = [
  '2025.03.21 11:32:44',
  '2025.03.20 11:32:44',
  '2025.03.19 11:32:44',
  '2025.03.18 11:32:44',
  '2025.03.17 11:32:44',
  '2025.03.16 11:32:44',
];

export default function BugReportPage() {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<BugRow | null>(null);
  const [detailStatus, setDetailStatus] = useState<BugStatus>('done');

  const list = useMemo(
    () =>
      q.trim()
        ? MOCK.filter(
            (r) =>
              r.title.toLowerCase().includes(q.toLowerCase()) ||
              r.detail.toLowerCase().includes(q.toLowerCase()) ||
              r.memo.toLowerCase().includes(q.toLowerCase()),
          )
        : MOCK,
    [q],
  );

  const stats = useMemo(() => {
    const open = list.filter((r) => r.status === 'open').length;
    const progress = list.filter((r) => r.status === 'progress').length;
    const done = list.filter((r) => r.status === 'done').length;
    return { open, progress, done, total: list.length };
  }, [list]);

  // 행 클릭 시 서랍 오픈
  const handleRowClick = (row: BugRow) => {
    setSelected(row);
    setDetailStatus(row.status);
  };

  const closeDrawer = () => setSelected(null);

  return (
    <div className={styles.page}>
      {/* 상단 타이틀 */}
      <div className={styles.head}>
        <h1 className={styles.title}>버그 리포트</h1>
      </div>

      {/* 통계 카드 */}
      <section className={styles.stats}>
        <div className={`${styles.card} ${styles.yellow}`}>
          <div className={styles.cardLabel}>해결 안 된 버그</div>
          <div className={styles.cardNum}>{stats.open}건</div>
        </div>
        <div className={`${styles.card} ${styles.mint}`}>
          <div className={styles.cardLabel}>해결중인 버그</div>
          <div className={styles.cardNum}>{stats.progress}건</div>
        </div>
        <div className={`${styles.card} ${styles.purple}`}>
          <div className={styles.cardLabel}>해결된 버그</div>
          <div className={styles.cardNum}>{stats.done}건</div>
        </div>

     
      </section>
        {/* 검색 */}
      <div className={styles.searchRow}>
  <div className={styles.searchBox}>
    <input
      placeholder="고유번호 및 내용을 입력하세요..."
      value={q}
      onChange={(e) => setQ(e.target.value)}
    />
    <button>검색</button>
  </div>
</div>

      {/* 테이블 */}
      <section className={styles.tableWrap}>
        <div className={styles.total}>Total {stats.total} bugs</div>
          <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 140 }}>고유번호</th>
                <th>내용</th>
                <th style={{ width: 120 }}>발생횟수</th>
                <th style={{ width: 120 }}>상태</th>
                <th style={{ width: 360 }}>메모</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => (
                <tr
                  key={`${r.id}-${i}`}
                  className={`${r.highlight ? styles.highlight : ''} ${
                    selected === r ? styles.rowSelected : ''
                  }`}
                  onClick={() => handleRowClick(r)}
                >
                  <td className={styles.mono}>uuid</td>
                  <td>
                    <div className={styles.rowTitle}>
                      <span className={styles.dot} />
                      <span className={styles.err}>{r.title}</span>
                    </div>
                    <div className={styles.rowDetail}>{r.detail}</div>
                  </td>
                  <td>{r.count}회</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        r.status === 'done'
                          ? styles.done
                          : r.status === 'progress'
                          ? styles.progress
                          : r.status === 'need-fix'
                          ? styles.needfix
                          : styles.open
                      }`}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className={styles.ellipsis}>{r.memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 (퍼블용 더미) */}
        <div className={styles.paging}>
          <button className={styles.arrow}>{'<'}</button>
          {[1, 2, 3, 4, 10, 11].map((n, idx) => (
            <button key={idx} className={`${styles.pageBtn} ${n === 1 ? styles.active : ''}`}>
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
              <div>
                <div className={styles.drawerLabel}>고유번호</div>
                <div className={styles.drawerId}>{selected.id}</div>
              </div>
              <button className={styles.drawerClose} onClick={closeDrawer}>
                ✕
              </button>
            </div>

            <div className={styles.drawerRowTop}>
              <div>
                <span className={styles.drawerLabel}>발생횟수</span>
                <span className={styles.drawerCount}>{selected.count}회</span>
              </div>
              <div className={styles.drawerStatusBox}>
                <span className={styles.drawerLabel}>상태</span>
                <select
                  className={styles.drawerSelect}
                  value={detailStatus}
                  onChange={(e) => setDetailStatus(e.target.value as BugStatus)}
                >
                  <option value="open">확인 필요</option>
                  <option value="need-fix">개발중</option>
                  <option value="progress">해결중</option>
                  <option value="done">확인 완료</option>
                </select>
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
                  {selected.detail.replace('...', ' or misconfiguration and was unable to complete the request.')}
                </p>
              </div>
            </section>

            {/* 발생일 리스트 */}
            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>발생일</h3>
              <div className={styles.drawerListBox}>
                <ul>
                  {MOCK_OCCURS.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 메모 */}
            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>메모</h3>
              <textarea
                className={styles.drawerMemo}
                defaultValue={selected.memo}
              />
            </section>

            <div className={styles.drawerFooter}>
              <button className={styles.drawerSubmit}>수정 완료</button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
