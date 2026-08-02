'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Bookmark, Building2, CalendarDays, Menu, Search, X } from 'lucide-react';

const APPLY_HOME_COMPETITION_URL =
  'https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do';
const APPLY_HOME_WINNER_URL =
  'https://www.applyhome.co.kr/wa/waa/selectAptPrzwinDescList.do';

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [isMobileSearchOpen]);

  // 검색 버튼 클릭시 동작
  const handleSearch = () => {
    if (!searchQuery) {
      return;
    }
    const query = searchQuery.trim();
    if (query !== '') {
      router.push(`/search?query=${encodeURIComponent(query)}`);
      setIsMobileSearchOpen(false);
    } else {
      return;
    }
  };
  // input창에 검색어 변경시 state 업데이트
  const onChangeSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  // 엔터키 입력시 검색 되게끔 기능 구현
  const handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const closeMobileMenuAfterClick = () => {
    window.setTimeout(() => {
      setIsMobileMenuOpen(false);
    }, 0);
  };

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white border-b border-gray-200 z-300 px-4 lg:px-8 flex items-center justify-between lg:grid lg:grid-cols-3">
      {/* 로고 영역 */}
      <Link
        href="/"
        className={`flex items-center gap-1 cursor-pointer transition-opacity duration-200 ${isMobileSearchOpen ? 'lg:opacity-100 opacity-100' : ''
          }`}
      >
        <Image
          src="/images/byzip_logo.png"
          alt="logoImg"
          width={30}
          height={30}
          priority
        />
        <span className="font-pyeongchang text-lg font-bold pl-2 pt-px">
          분양모음집
        </span>
      </Link>

      {/* 검색창 영역 - 모바일에서는 숨김 */}
      <div className="hidden lg:flex w-full items-center justify-center">
        <div className="relative w-full max-w-lg">
          <input
            onChange={onChangeSearchQuery}
            onKeyDown={handleEnterKey}
            value={searchQuery}
            type="text"
            placeholder="지역, 분양단지, 공고명을 검색해보세요."
            className="w-full h-10 px-4 pr-12 border border-gray-200 rounded-full text-sm! leading-4 font-medium outline-none focus:border-brand-blue transition-all"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-brand-blue transition-colors"
            onClick={handleSearch}
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* 모바일 검색창: 검색 버튼을 누르면 오른쪽에서 왼쪽으로 슬라이드되어 나타납니다. */}
      <div
        className={`lg:hidden absolute left-14 right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${isMobileSearchOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : 'translate-x-full opacity-0 pointer-events-none'
          }`}
      >
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700"
            aria-hidden="true"
          />
          <input
            ref={mobileSearchInputRef}
            onChange={onChangeSearchQuery}
            onKeyDown={handleEnterKey}
            value={searchQuery}
            type="text"
            placeholder="지역, 분양형태, 주택명을 검색해보세요."
            className="w-full h-10 rounded-full border border-gray-300 bg-white pl-9 pr-9 text-xs font-medium outline-none focus:border-brand-blue"
          />
          <button
            type="button"
            aria-label="검색창 닫기"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            onClick={() => setIsMobileSearchOpen(false)}
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* 네비게이션: 데스크톱은 텍스트 링크, 모바일 북마크는 햄버거 메뉴 안에서 제공 */}
      <nav className="flex justify-end items-center gap-2.5 lg:gap-9 h-full">
        <div className="hidden lg:flex items-center gap-9">
          <Link
            href="/calendar"
            className={`text-sm font-semibold hover:text-brand-blue transition-colors ${pathname === '/calendar' ? 'text-brand-blue' : 'text-black'
              }`}
          >
            청약캘린더
          </Link>
          <Link
            href="/bookmark"
            className={`text-sm font-semibold hover:text-brand-blue transition-colors ${pathname === '/bookmark' ? 'text-brand-blue' : 'text-black'
              }`}
          >
            북마크
          </Link>
        </div>

        <div
          className={`lg:hidden flex items-center gap-4 transition-opacity duration-200 ${isMobileSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
          <button
            type="button"
            className="text-black"
            aria-label="검색 열기"
            onClick={() => setIsMobileSearchOpen(true)}
          >
            <Search size={24} />
          </button>
          <button
            type="button"
            className="text-black"
            aria-label="메뉴 열기"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* 
        모바일 메뉴 전체 컨테이너 
        - isMobileMenuOpen 상태에 따라 pointer-events 및 visibility를 전환하여 트랜지션 애니메이션 완료 후 완전히 숨깁니다.
        - transition-all duration-300을 적용하여 부드러운 상태 전환을 지원합니다.
      */}
      <div
        className={`lg:hidden fixed inset-0 top-0 z-400 transition-all duration-300 ${isMobileMenuOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
          }`}
      >
        {/* 
          메뉴 배경 (Dimmed Layer)
          - 뒷배경을 어둡게 처리하는 반투명 레이어입니다.
          - 메뉴가 열리면 서서히 불투명해지고(opacity-100), 닫히면 투명해지도록(opacity-0) 트랜지션을 적용합니다.
        */}
        <button
          type="button"
          aria-label="메뉴 배경 닫기"
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* 
          메뉴 바 (Sidebar Aside)
          - 우측에서 왼쪽으로 슬라이드하며 들어오고(translate-x-0) 나가는(translate-x-full) 애니메이션을 구현합니다.
          - transition-transform duration-300 ease-in-out 효과로 부드러운 슬라이딩 모션을 제공합니다.
        */}
        <aside
          className={`absolute right-0 top-0 h-full w-[82vw] max-w-95 bg-white px-5 py-5 shadow-[-12px_0_32px_rgba(15,23,42,0.2)] transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          {/* 모바일 메뉴 닫기 버튼 영역 */}
          <div className="mb-8 h-9">
            <button
              type="button"
              aria-label="메뉴 닫기"
              className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center text-black transition-colors hover:text-brand-blue"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={20} strokeWidth={2.2} />
            </button>
          </div>

          {/* 서비스 로고 및 타이틀 영역 */}
          <div className="mb-9 flex flex-col items-center gap-2.5">
            <Image
              src="/images/byzip_logo.png"
              alt="분양모음집"
              width={58}
              height={58}
              priority
            />
            <span className="font-pyeongchang text-[15px] font-bold">분양모음집</span>
          </div>

          {/* 메뉴 링크 리스트 영역 */}
          <div className="flex flex-col gap-4 text-[15px] font-bold text-black">
            {/* 청약캘린더 페이지 링크 */}
            <Link
              href="/calendar"
              className="flex min-h-19 items-center gap-4 rounded-2xl border border-gray-100 bg-white px-4 shadow-[0_3px_10px_rgba(15,23,42,0.11)] transition-colors hover:bg-[#f8fbff]"
              onClick={closeMobileMenuAfterClick}
            >
              <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#eff4ff] text-brand-blue">
                <CalendarDays size={26} strokeWidth={2.2} />
              </span>
              <span className="text-base font-bold">청약캘린더</span>
            </Link>

            {/* 북마크 페이지 링크 */}
            <Link
              href="/bookmark"
              className="flex min-h-19 items-center gap-4 rounded-2xl border border-gray-100 bg-white px-4 shadow-[0_3px_10px_rgba(15,23,42,0.11)] transition-colors hover:bg-[#f8fbff]"
              onClick={closeMobileMenuAfterClick}
            >
              <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#eff4ff] text-brand-blue">
                <Bookmark size={26} strokeWidth={2.2} />
              </span>
              <span className="text-base font-bold">북마크</span>
            </Link>

            {/* 외부 청약경쟁률 확인 링크 */}
            <a
              href={APPLY_HOME_COMPETITION_URL}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-19 items-center gap-4 rounded-2xl border border-gray-100 bg-white px-4 shadow-[0_3px_10px_rgba(15,23,42,0.11)] transition-colors hover:bg-[#f8fbff]"
              onClick={closeMobileMenuAfterClick}
            >
              <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#eff4ff] text-brand-blue">
                <BarChart3 size={26} strokeWidth={2.2} />
              </span>
              <span className="text-base font-bold">청약경쟁률 확인</span>
            </a>

            {/* 외부 청약당첨자 확인 링크 */}
            <a
              href={APPLY_HOME_WINNER_URL}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-19 items-center gap-4 rounded-2xl border border-gray-100 bg-white px-4 shadow-[0_3px_10px_rgba(15,23,42,0.11)] transition-colors hover:bg-[#f8fbff]"
              onClick={closeMobileMenuAfterClick}
            >
              <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#eff4ff] text-brand-blue">
                <Building2 size={26} strokeWidth={2.2} />
              </span>
              <span className="text-base font-bold">청약당첨자 확인</span>
            </a>
          </div>
        </aside>
      </div>
    </header>
  );
};

export default Header;
