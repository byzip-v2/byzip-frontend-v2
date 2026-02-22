'use client';

import styles from '@/styles/pages/admin/admin-layout.module.scss';
import { BarChart3, Folder, LayoutDashboard, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 네비게이션 메뉴 설정
const navigationItems = [
  {
    label: '대시보드',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: '분양공고 관리',
    href: '/admin/posts',
    icon: Folder,
  },
  {
    label: '좌표 관리',
    href: '/admin/geo',
    icon: Users,
  },
  {
    label: '버그리포트',
    href: '/admin/bugs',
    icon: BarChart3,
  },
];

export default function NavigationMenu() {
  const pathname = usePathname();

  return (
    <nav className={styles.sidebarNav}>
      <ul className={styles.navList}>
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = pathname === item.href;

          return (
            <li
              key={item.label}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Link href={item.href} className={styles.navLink}>
                <IconComponent className={styles.navIcon} size={20} />
                <span className={styles.navText}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
