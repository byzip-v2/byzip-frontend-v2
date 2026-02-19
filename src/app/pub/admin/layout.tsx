'use client';

import styles from '@/styles/pages/admin/admin-layout.module.scss';
import { BarChart3, Folder, LayoutDashboard, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/pub/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/pub/admin/housing', icon: Folder, label: '분양공고 관리' },
  { href: '/pub/admin/geo', icon: Users, label: '좌표 관리' },
  { href: '/pub/admin/bug', icon: BarChart3, label: '버그리포트' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

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
          <h1 className={styles.pageTitle}>좌표 관리</h1>
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

          <nav className={styles.sidebarNav}>
            <ul className={styles.navList}>
              {NAV.map(({ href, icon: Icon, label }) => (
                <li
                  key={href}
                  className={`${styles.navItem} ${isActive(href) ? styles.active : ''}`}
                >
                  <Link href={href} className={styles.navLink}>
                    <Icon className={styles.navIcon} size={20} />
                    <span className={styles.navText}>{label}</span>
                  </Link>
                </li>
              ))}
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
          <div className={styles.mainContent}>{children}</div>
        </main>
      </div>
    </div>
  );
}
