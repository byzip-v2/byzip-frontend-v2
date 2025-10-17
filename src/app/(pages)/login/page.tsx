import styles from '@/styles/pages/login/login.module.scss';
import Image from 'next/image';
import { requireGuest } from '@/app/libs/utils/auth';
import LoginForm from './components/LoginForm';

export default async function LoginPage() {
  // 서버에서 인증 상태 체크 - 이미 로그인된 사용자는 admin으로 리다이렉트
  await requireGuest('/admin');

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
