'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/(pages)/login/actions';

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await logoutAction();
      // 로그아웃 후 로그인 페이지로 이동
      router.push('/login');
      // 페이지 새로고침으로 상태 초기화
      window.location.reload();
    } catch (error) {
      console.error('로그아웃 중 에러:', error);
      setIsLoading(false); // 에러 시에만 상태 리셋
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      style={{
        padding: '8px 16px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isLoading ? '로그아웃 중...' : '로그아웃'}
    </button>
  );
}
