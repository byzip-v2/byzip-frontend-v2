import styles from '@/styles/pages/login/login.module.scss';
import Image from 'next/image';
import LoginForm from './components/LoginForm';
import type { Metadata } from 'next';

// (한국어) 로그인 화면의 브라우저 탭 타이틀 최적화를 위한 메타데이터 설정
export const metadata: Metadata = {
  title: '로그인',
};

export default async function LoginPage() {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <Image
          src="/images/byzip_logo.png"
          alt="분양모음집 로고"
          width={30}
          height={45}
          loading="eager"
          priority
        />
        <span>분양모음집-관리자</span>
      </header>
      <LoginForm />
    </div>
  );
}
