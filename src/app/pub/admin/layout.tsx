'use client';

import styles from '@/styles/pages/admin/admin-layout.module.scss';
import { BarChart3, Folder, LayoutDashboard, Users } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.adminLayout}>
      {/* 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <img src="/images/admin/logo.png" alt="분양모음집 로고" className={styles.logoIcon} />
            <div className={styles.logoText}>
              <div className={styles.serviceName}>분양모음집</div>
              <div className={styles.adminLabel}>관리자</div>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <h1 className={styles.pageTitle}>좌표 관리</h1>
        </div>
      </header>

      <div className={styles.adminBody}>
        {/* 사이드바 */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarLogo}>
              <img src="/images/byzip_logo.png" alt="분양모음집 로고" className={styles.sidebarLogoIcon} />
              <div className={styles.sidebarLogoText}>
                <div className={styles.sidebarServiceName}>분양모음집</div>
                <div className={styles.sidebarAdminLabel}>관리자</div>
              </div>
            </div>
          </div>
          
          <nav className={styles.sidebarNav}>
            <ul className={styles.navList}>
              <li className={styles.navItem}>
                <a href="/" className={styles.navLink}>
                  <LayoutDashboard className={styles.navIcon} size={20} />
                  <span className={styles.navText}>Dashboard</span>
                </a>
              </li>
              <li className={styles.navItem}>
                <a href="/" className={styles.navLink}>
                  <Folder className={styles.navIcon} size={20} />
                  <span className={styles.navText}>분양공고 관리</span>
                </a>
              </li>
              <li className={`${styles.navItem} ${styles.active}`}>
                <a href="/pub/admin/geo" className={styles.navLink}>
                <Users className={styles.navIcon} size={20} />
                  <span className={styles.navText}>좌표 관리</span>
                </a>
              </li>
              <li className={styles.navItem}>
                <a href="/" className={styles.navLink}>
                  <BarChart3 className={styles.navIcon} size={20} />
                  <span className={styles.navText}>버그리포트</span>
                </a>
              </li>
            </ul>
          </nav>

          {/* 사용자 정보 */}
          <div className={styles.userInfo}>
            <div className={styles.userDetails}>
              <div className={styles.userName}>박성환</div>
              <div className={styles.userEmail}>psh@by-zip.com</div>
            </div>
            <button className={styles.logoutBtn}>로그아웃</button>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className={styles.main}>
          <div className={styles.mainContent}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
