'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/(pages)/login/actions';
import Spinner from '@/app/components/common/Spinner/Spinner';
import styles from '@/styles/pages/admin/admin-layout.module.scss';

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
      className={styles.logoutBtn}
    >
      {isLoading ? <Spinner /> : '로그아웃'}
    </button>
  );
}
