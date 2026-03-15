'use client';

import React, { useMemo } from 'react';
import styles from '@/styles/components/pagination.module.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasData?: boolean;
}

type PaginationItem = number | 'ellipsis';

const getPageItems = (
  currentPageNum: number,
  totalPagesNum: number,
): PaginationItem[] => {
  const currentPage = Number(currentPageNum);
  const totalPages = Number(totalPagesNum);

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: PaginationItem[] = [1];

  // 현재 페이지 기준 앞뒤 2개씩 노출 (총 5개 범위 설정)
  let start = Math.max(2, currentPage - 2);
  let end = Math.min(totalPages - 1, currentPage + 2);

  // 현재 페이지가 앞쪽에 치우친 경우
  if (currentPage <= 4) {
    start = 2;
    end = 5;
  }
  // 현재 페이지가 뒤쪽에 치우친 경우
  else if (currentPage >= totalPages - 3) {
    start = totalPages - 4;
    end = totalPages - 1;
  }

  if (start > 2) {
    items.push('ellipsis');
  }

  for (let i = start; i <= end; i++) {
    items.push(i);
  }

  if (end < totalPages - 1) {
    items.push('ellipsis');
  }

  items.push(totalPages);

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

  if (!hasData || totalPages <= 1) {
    return null;
  }

  const handlePageClick = (page: number) => {
    if (page === internalPage) return;
    setInternalPage(page);
    onPageChange(page);
  };

  return (
    <div className={styles.paging}>
      <button
        type="button"
        className={styles.arrow}
        disabled={Number(internalPage) <= 1}
        onClick={() => handlePageClick(Number(internalPage) - 1)}
      >
        {'<'}
      </button>

      {pageItems.map((item, idx) =>
        item === 'ellipsis' ? (
          <span key={`dots-${idx}`} className={styles.pageDots}>
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={`${styles.pageBtn} ${Number(item) === Number(internalPage) ? styles.active : ''
              }`}
            onClick={() => handlePageClick(item)}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className={styles.arrow}
        disabled={Number(internalPage) >= totalPages}
        onClick={() => handlePageClick(Number(internalPage) + 1)}
      >
        {'>'}
      </button>
    </div>
  );
};

export default Pagination;
