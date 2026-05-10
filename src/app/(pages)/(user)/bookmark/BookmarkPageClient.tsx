'use client';

import React from 'react';
import type { HousingItem } from '@/app/(pages)/(user)/(with-map)/home/components/HousingCard';
import HousingListSection from '@/app/(pages)/(user)/(with-map)/home/components/HousingListSection';

/**
 * 북마크 목록용 목 데이터
 * - 추후 API/SDK 연동 시 같은 HousingItem[] 형태로 치환하면 HousingListSection을 그대로 재사용할 수 있습니다.
 * - 필드 의미는 홈(HomeClient)에서 DTO → 카드로 매핑할 때와 동일하게 맞춰 두었습니다.
 */
const MOCK_BOOKMARK_ITEMS: HousingItem[] = [
  {
    id: 'mock-bookmark-1',
    type: 'today',
    title: '힐스테이트 북마크 예시',
    subTitle: 'APT',
    region: '서울 강남구',
    area: '59㎡ ~ 84㎡',
    price: '공고문 확인',
    specialDate: '2026.05.10',
    regularDate: '2026.05.12 ~ 2026.05.14',
  },
  {
    id: 'mock-bookmark-2',
    type: 'coming',
    title: '래미안 모의 단지',
    subTitle: 'APT',
    region: '경기 성남시',
    area: '전용 74㎡',
    price: '미정',
    regularDate: '2026.06.01 ~ 2026.06.03',
  },
  {
    id: 'mock-bookmark-3',
    type: 'random',
    title: '무순위 모의 공고',
    subTitle: 'APT',
    region: '인천 연수구',
    area: '-',
    price: '공고문 확인',
    specialDate: '정보가 없습니다.',
    regularDate: '2026.05.20 ~ 2026.05.22',
  },
];

/**
 * 북마크 페이지 클라이언트 영역
 * - HousingListSection은 'use client' 경로에 있으므로 이 파일에서 감싸서 페이지 서버 컴포넌트와 역할을 분리합니다.
 * - flex-1 + min-h-0 조합은 메인 레이아웃(flex 컬럼) 안에서 리스트 섹션 스크롤이 깨지지 않게 하기 위함입니다.
 */
export default function BookmarkPageClient() {
  return (
    <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-4rem)] bg-[#f8faff] items-center">
      <div className="w-full max-w-3xl px-4 shrink-0">
        <h1
          className="text-xl font-bold font-pyeongchang text-black"
          style={{ marginBottom: '0px' }}
        >
          북마크
        </h1>
      </div>
      <HousingListSection
        items={MOCK_BOOKMARK_ITEMS}
        isLoading={false}
        emptyMessage="저장한 북마크가 없습니다."
      />
    </div>
  );
}
