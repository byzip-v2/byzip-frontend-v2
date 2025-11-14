'use client';

import { useEffect } from 'react';
import { logErrorToDatabase } from '@/app/libs/utils/api';
import { BugReportErrorType } from 'byzip-v2-sdk';

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1
        style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}
      >
        오류가 발생했습니다
      </h1>
      <p style={{ fontSize: '1rem', marginBottom: '2rem', color: '#666' }}>
        예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
      </p>
      {error.digest && (
        <p
          style={{
            fontSize: '0.875rem',
            marginBottom: '1rem',
            color: '#999',
            fontFamily: 'monospace',
          }}
        >
          오류 ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontWeight: '500',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#0051cc';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#0070f3';
        }}
      >
        다시 시도
      </button>
    </div>
  );
}
