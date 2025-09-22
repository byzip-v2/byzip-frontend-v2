import React from 'react';
import './admin-layout.css';

export interface AdminLayoutProps {
  /**
   * 현재 페이지 제목
   */
  pageTitle: string;
  /**
   * 메인 콘텐츠
   */
  children: React.ReactNode;
  /**
   * 현재 활성 메뉴
   */
  activeMenu?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  pageTitle,
  children,
  activeMenu = 'dashboard',
}) => {
  return (
    <div className="admin-layout">
      {/* 헤더 */}
      <header className="admin-header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">🏠</div>
            <div className="logo-text">
              <div className="service-name">분양모음집</div>
              <div className="admin-label">관리자</div>
            </div>
          </div>
        </div>
        <div className="header-right">
          <h1 className="page-title">{pageTitle}</h1>
        </div>
      </header>

      <div className="admin-body">
        {/* 사이드바 */}
        <aside className="admin-sidebar">
          <nav className="sidebar-nav">
            <ul className="nav-list">
              <li className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}>
                <a href="/admin/dashboard" className="nav-link">
                  <span className="nav-icon">📊</span>
                  <span className="nav-text">Dashboard</span>
                </a>
              </li>
              <li className={`nav-item ${activeMenu === 'announcements' ? 'active' : ''}`}>
                <a href="/admin/announcements" className="nav-link">
                  <span className="nav-icon">📁</span>
                  <span className="nav-text">분양공고 관리</span>
                </a>
              </li>
              <li className={`nav-item ${activeMenu === 'coordinates' ? 'active' : ''}`}>
                <a href="/admin/coordinates" className="nav-link">
                  <span className="nav-icon">📍</span>
                  <span className="nav-text">좌표 관리</span>
                </a>
              </li>
              <li className={`nav-item ${activeMenu === 'bugreports' ? 'active' : ''}`}>
                <a href="/admin/bugreports" className="nav-link">
                  <span className="nav-icon">🐛</span>
                  <span className="nav-text">버그리포트</span>
                </a>
              </li>
            </ul>
          </nav>

          {/* 사용자 정보 */}
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">박성환</div>
              <div className="user-email">psh@by-zip.com</div>
            </div>
            <button className="logout-btn">로그아웃</button>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="admin-main">
          <div className="main-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
