'use client';

import { useState } from 'react';

/**
 * 클라이언트 사이드 렌더링 에러 테스트 버튼 컴포넌트
 * ErrorTestButton과 동일한 스타일로 통일
 */
export default function ClientErrorTestButton() {
  const [loading, setLoading] = useState(false);
  const [shouldThrow, setShouldThrow] = useState(false);

  // 렌더링 중 에러 발생 (에러 바운더리가 캐치)
  if (shouldThrow) {
    throw new Error('테스트용 클라이언트 에러: 렌더링 중 에러 발생');
  }

  const handleClick = () => {
    setLoading(true);
    // 상태를 변경하여 리렌더링 시 에러 발생
    setShouldThrow(true);
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          padding: '8px 16px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          marginRight: '8px',
        }}
      >
        {loading ? '테스트 중...' : '렌더링 중 에러 발생'}
      </button>
    </div>
  );
}
