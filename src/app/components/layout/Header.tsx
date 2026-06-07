'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Menu, Bookmark } from 'lucide-react';

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 검색 버튼 클릭시 동작
  const handleSearch = () => {
    if(!searchQuery){
      return;
    }
    const query = searchQuery.trim();
    if (query !== '') {
      router.push(`/search?query=${query}`);
    }else{
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

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white border-b border-gray-200 z-300 px-4 md:px-8 flex items-center justify-between md:grid md:grid-cols-3">
      {/* 로고 영역 */}
      <Link href="/" className="flex items-center gap-1 cursor-pointer">
        <Image
          src="/images/byzip_logo.png"
          alt="logoImg"
          width={30}
          height={30}
          priority
        />
        <span className="font-pyeongchang text-lg font-bold pl-2 pt-px hidden sm:block">
          분양모음집
        </span>
      </Link>

      {/* 검색창 영역 - 모바일에서는 숨김김 */}
      <div className="hidden md:flex w-full items-center justify-center">
        <div className="relative w-full max-w-lg">
          <input
            onChange={(e) => onChangeSearchQuery(e)}
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

      {/* 네비게이션: 데스크톱은 텍스트 링크, 모바일은 아이콘으로 동일 경로 제공 */}
      <nav className="flex justify-end items-center gap-2.5 md:gap-9 h-full">
        <div className="hidden md:flex items-center gap-9">
          <Link
            href="/calendar"
            className={`text-sm font-semibold hover:text-brand-blue transition-colors ${
              pathname === '/calendar' ? 'text-brand-blue' : 'text-black'
            }`}
          >
            청약캘린더
          </Link>
          <Link
            href="/bookmark"
            className={`text-sm font-semibold hover:text-brand-blue transition-colors ${
              pathname === '/bookmark' ? 'text-brand-blue' : 'text-black'
            }`}
          >
            북마크
          </Link>
        </div>

        {/* 모바일: 공간 제약으로 아이콘 링크로 북마크 진입 (검색/메뉴와 동일 높이) */}
        <div className="md:hidden flex items-center gap-4">
          <Link
            href="/bookmark"
            aria-label="북마크"
            className={`text-black hover:text-brand-blue transition-colors ${pathname === '/bookmark' ? 'text-brand-blue' : ''}`}
          >
            <Bookmark size={24} />
          </Link>
          <button type="button" className="text-black">
            <Search size={24} />
          </button>
          <button type="button" className="text-black">
            <Menu size={24} />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
