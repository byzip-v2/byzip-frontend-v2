'use client';

import React from 'react';
import { useMapStore } from '@/app/libs/stores/zustand/useMapStore';

interface ViewToggleProps {
  /**
   * (한국어 주석) 추가적인 레이아웃 정렬 스타일(예: ml-auto 등)을 유연하게 적용하기 위한 className 속성입니다.
   */
  className?: string;
}

/**
 * ViewToggle Component
 * - 1024px 미만 반응형 화면에서 리스트 뷰와 지도 뷰의 상태를 전환하는 공용 세그먼트 토글 스위치입니다.
 * - '지역 / 분양형태' 필터 버튼과 통일되도록 테두리 곡률(radius)은 rounded-md가 적용되었습니다.
 */
export default function ViewToggle({ className = '' }: ViewToggleProps) {
  const { isMobileLayout, viewType, setViewType } = useMapStore();

  // (한국어 주석) 1024px 미만 모바일 레이아웃 환경이 아닌 경우에는 토글 버튼을 화면에 렌더링하지 않습니다.
  if (!isMobileLayout) {
    return null;
  }

  return (
    <div className={`flex items-center bg-[#f1f3f6] p-0.5 rounded-md h-[32px] ${className}`}>
      <button
        type="button"
        onClick={() => setViewType('list')}
        className={`px-4 h-full text-[14px]! rounded-md transition-all duration-200 ${viewType === 'list'
          ? 'bg-white text-[#356EFF] font-bold shadow-[0_2px_5px_rgba(0,0,0,0.08)]'
          : 'bg-transparent text-[#9ca3af] font-medium'
          }`}
      >
        리스트
      </button>
      <button
        type="button"
        onClick={() => setViewType('map')}
        className={`px-4 h-full text-[14px]! rounded-md transition-all duration-200 ${viewType === 'map'
          ? 'bg-white text-[#356EFF] font-bold shadow-[0_2px_5px_rgba(0,0,0,0.08)]'
          : 'bg-transparent text-[#9ca3af] font-medium'
          }`}
      >
        지도
      </button>
    </div>
  );
}
