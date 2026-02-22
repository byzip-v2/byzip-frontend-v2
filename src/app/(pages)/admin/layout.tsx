import styles from '@/styles/pages/admin/admin-layout.module.scss';
import Image from 'next/image';
import { getUserInfo } from './actions';
import NavigationMenu from '@/app/(pages)/admin/components/NavigationMenu';
import UserInfo from '@/app/(pages)/admin/components/UserInfo';

// 동적 렌더링 강제 설정
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 사용자 정보 가져오기
  const userInfoResult = await getUserInfo();
  const userInfo =
    userInfoResult.success && userInfoResult.data ? userInfoResult.data : null;

  return (
    <div className={styles.adminLayout}>
      {/* 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <Image
              src="/images/admin/logo.png"
              alt="분양모음집 로고"
              className={styles.logoIcon}
              width={100}
              height={100}
            />
            <div className={styles.logoText}>
              <div className={styles.serviceName}>분양모음집</div>
              <div className={styles.adminLabel}>관리자</div>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <h1 className={styles.pageTitle}>관리자</h1>
        </div>
      </header>

      <div className={styles.adminBody}>
        {/* 사이드바 */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarLogo}>
              <Image
                src="/images/byzip_logo.png"
                alt="분양모음집 로고"
                className={styles.sidebarLogoIcon}
                width={100}
                height={100}
              />
              <div className={styles.sidebarLogoText}>
                <div className={styles.sidebarServiceName}>분양모음집</div>
                <div className={styles.sidebarAdminLabel}>관리자</div>
              </div>
            </div>
          </div>

          {/* 네비게이션 메뉴 */}
          <NavigationMenu />

          {/* 사용자 정보 */}
          <UserInfo userInfo={userInfo} />
        </aside>

        {/* 메인 콘텐츠 */}
        <main className={styles.main}>
          <div className={styles.mainContent}>{children}</div>
        </main>
      </div>
    </div>
  );
}
