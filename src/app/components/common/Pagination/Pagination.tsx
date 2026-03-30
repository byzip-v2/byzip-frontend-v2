'use client';

import React, { useMemo } from 'react';
import styles from '@/styles/components/pagination.module.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasData?: boolean;
}


const PAGE_BLOCK_SIZE = 5;

const getPageItems = (
  currentPageNum: number,
  totalPagesNum: number,
): number[] => {
  const currentPage = Number(currentPageNum);
  const totalPages = Number(totalPagesNum);

  // 현재 페이지가 속한 블록의 시작 페이지 계산
  // 1-5페이지 -> 시작 1, 6-10페이지 -> 시작 6
  const currentBlock = Math.ceil(currentPage / PAGE_BLOCK_SIZE);
  const start = (currentBlock - 1) * PAGE_BLOCK_SIZE + 1;

  // 블록의 끝 페이지 계산 (전체 페이지 수를 넘지 않도록 처리)
  const end = Math.min(start + PAGE_BLOCK_SIZE - 1, totalPages);

  const items = [];
  for (let i = start; i <= end; i++) {
    items.push(i);
  }

  return items;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage: propPage,
  totalPages,
  onPageChange,
  hasData = true,
}) => {
  // 사용자의 클릭에 즉각 반응하기 위한 내부 상태 (낙관적 UI)
  const [internalPage, setInternalPage] = React.useState(propPage);

  // 부모로부터 내려오는 propPage가 변경되면 내부 상태 동기화
  React.useEffect(() => {
    setInternalPage(propPage);
  }, [propPage]);

  const pageItems = useMemo(
    () => getPageItems(internalPage, totalPages),
    [internalPage, totalPages],
  );

  const currentBlock = Math.ceil(internalPage / PAGE_BLOCK_SIZE);
  const start = (currentBlock - 1) * PAGE_BLOCK_SIZE + 1;
  const end = Math.min(start + PAGE_BLOCK_SIZE - 1, totalPages);

  if (!hasData || totalPages <= 1) {
    return null;
  }

  const handlePageClick = (page: number) => {
    if (page === internalPage) return;
    setInternalPage(page);
    onPageChange(page);
  };

  /** 이전 블록으로 이동 */
  // 이전, 다음 버튼을 5개 단위로 이동
  const handlePrevBlock = () => {
    const prevBlockStart = Math.max(1, start - PAGE_BLOCK_SIZE);
    handlePageClick(prevBlockStart);
  };

  /** 다음 블록으로 이동 */
  const handleNextBlock = () => {
    const nextBlockStart = Math.min(totalPages, start + PAGE_BLOCK_SIZE);
    handlePageClick(nextBlockStart);
  };

  return (
    <div className={styles.paging}>
      <button
        type="button"
        className={styles.arrow}
        disabled={currentBlock === 1}
        onClick={handlePrevBlock}
      >
        {'<'}
      </button>

      {pageItems.map((item) => (
        <button
          key={item}
          type="button"
          className={`${styles.pageBtn} ${Number(item) === Number(internalPage) ? styles.active : ''
            }`}
          onClick={() => handlePageClick(item)}
        >
          {item}
        </button>
      ))}

      <button
        type="button"
        className={styles.arrow}
        disabled={end >= totalPages}
        onClick={handleNextBlock}
      >
        {'>'}
      </button>
    </div>
  );
};

export default Pagination;
