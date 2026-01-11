'use client';

import { useEffect } from 'react';
import { logErrorToDatabase } from '@/app/libs/utils/api';
import { BugReportErrorType } from 'byzip-v2-sdk';
import styles from '@/styles/pages/error/error.module.scss';

/**
 * 전역 에러 바운더리 컴포넌트
 * 클라이언트 사이드에서 발생한 에러를 캐치하여 로깅하고 사용자에게 표시
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 발생 시 DB에 로깅 (클라이언트 에러로 분류)
    logErrorToDatabase(error, {
      errorType: BugReportErrorType.CLIENT_ERROR,
    });
  }, [error]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>오류가 발생했습니다</h1>
      <p className={styles.message}>
        예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
      </p>
      <button onClick={reset} className={styles.retryButton}>
        다시 시도
      </button>
    </div>
  );
}
