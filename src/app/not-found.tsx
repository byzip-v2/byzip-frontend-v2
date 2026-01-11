import Link from 'next/link';
import styles from '@/styles/pages/error/error.module.scss';

/**
 * 404 Not Found 페이지 컴포넌트
 * 존재하지 않는 페이지에 접근할 때 표시되는 페이지
 */
export default function NotFound() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>404</h1>
      <p className={styles.notFoundMessage}>
        요청하신 페이지를 찾을 수 없습니다.
        <br />
        주소를 다시 한번 확인해주세요.
      </p>
      <Link href="/" className={styles.retryButton}>
        홈으로 돌아가기
      </Link>
    </div>
  );
}
