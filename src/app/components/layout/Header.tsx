'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu } from 'lucide-react';

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 w-full h-[60px] bg-white border-b border-gray-200 z-300 px-4 md:px-[30px] grid grid-cols-3 items-center">
      {/* 로고 영역 */}
      <Link href="/" className="flex items-center gap-1 cursor-pointer">
        <Image
          src="/images/byzip_logo.png"
          alt="logoImg"
          width={30}
          height={30}
          priority
        />
        <span className="font-pyeongchang text-[18px] font-bold pl-[7px] pt-px hidden sm:block">
          분양모음집
        </span>
      </Link>

      {/* 검색창 영역 (추후 구현) */}
      <div className="w-full h-full flex items-center justify-center">
        {/* <SearchWeb /> - v1의 검색바 자리 */}
      </div>

      {/* 네비게이션 영역 - 우측에 청약캘린더만 */}
      <nav className="flex justify-end items-center gap-[10px] md:gap-[35px] h-full">
        <div className="hidden md:flex items-center">
          <Link
            href="/calendar"
            className={`text-[14px] font-semibold hover:text-brand-blue transition-colors ${
              pathname === '/calendar' ? 'text-brand-blue' : 'text-black'
            }`}
          >
            청약캘린더
          </Link>
        </div>

        {/* 모바일 아이콘 */}
        <div className="md:hidden flex items-center gap-4">
          <button className="text-black">
            <Search size={24} />
          </button>
          <button className="text-black">
            <Menu size={24} />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
