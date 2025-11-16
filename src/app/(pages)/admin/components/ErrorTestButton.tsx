'use client';

import { useState } from 'react';
import { triggerTestError } from '../actions';

type ErrorType = '404' | '500' | 'network' | 'timeout';

interface ErrorTestButtonProps {
  errorType: ErrorType;
  label: string;
}

export default function ErrorTestButton({
  errorType,
  label,
}: ErrorTestButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await triggerTestError(errorType);
      setMessage(result.message);
    } catch (error) {
      setMessage(
        `에러 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    } finally {
      setLoading(false);
    }
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
        {loading ? '테스트 중...' : label}
      </button>
      {message && (
        <span
          style={{
            fontSize: '14px',
            color: message.includes('에러 발생') ? '#ef4444' : '#6b7280',
            marginLeft: '8px',
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
}
