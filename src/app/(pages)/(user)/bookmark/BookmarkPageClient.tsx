'use client';

import React, { useEffect, useState } from 'react';
import type { HousingItem } from '@/app/(pages)/(user)/(with-map)/components/HousingCard';
import HousingListSection from '@/app/(pages)/(user)/(with-map)/components/HousingListSection';
import { getPublicHousingSupplies } from '@/app/(pages)/(user)/(with-map)/actions';
import { useHousingStore } from '@/app/libs/stores/zustand/useHousingStore';
import Spinner from '@/app/components/common/Spinner/Spinner';
import {
  determineHousingType,
  formatDateRange,
  formatDateString,
} from '@/app/libs/utils/date';

/**
 * 로컬스토리지 북마크 저장 키값 (DetailPageClient.tsx의 키와 일치)
 */
const DETAIL_BOOKMARK_STORAGE_KEY = 'byzip:detail-bookmarks';

/**
 * 북마크 페이지 클라이언트 컴포넌트
 * - localStorage에 저장된 공고 ID 목록을 로드하고, useHousingStore 전역 캐시를 필터링하여 노출합니다.
 * - 전역 캐시가 없는 경우(예: 홈을 거치지 않은 경우), 북마크 페이지에서 직접 현재 진행 중인 공고 리스트(recruiting: true)를 불러옵니다.
 */
export default function BookmarkPageClient() {
  const { housingData, setHousingData } = useHousingStore();

  // 가공 완료되어 UI에 전달할 북마크 카드 리스트
  const [bookmarkItems, setBookmarkItems] = useState<HousingItem[]>([]);

  // 하이드레이션(Hydration) 방지를 위한 마운트 상태값
  const [isMounted, setIsMounted] = useState(false);

  // 직접 API 데이터를 가져올 때의 로딩 상태값
  const [isApiLoading, setIsApiLoading] = useState(false);

  // 북마크 저장소가 실제로 비어있는지 여부를 판단하기 위한 상태값
  const [hasBookmarks, setHasBookmarks] = useState(true);

  useEffect(() => {
    setIsMounted(true);

    // 1. 로컬스토리지로부터 북마크 ID 목록(string[])을 가져옵니다.
    let savedBookmarkIds: string[] = [];
    try {
      const raw = localStorage.getItem(DETAIL_BOOKMARK_STORAGE_KEY);
      if (raw) {
        savedBookmarkIds = JSON.parse(raw);
      }
    } catch (error) {
      console.error('🔍 [Bookmark] 로컬스토리지 로드 실패:', error);
    }

    if (!savedBookmarkIds || savedBookmarkIds.length === 0) {
      setBookmarkItems([]);
      setHasBookmarks(false);
      return;
    }

    setHasBookmarks(true);

    // 2. 전역 스토어에 전체 공고 데이터가 비어 있는 경우, 현재 진행 중인 공고 데이터를 직접 패치합니다.
    const fetchNeededData = async () => {
      if (housingData.length === 0) {
        setIsApiLoading(true);
        try {
          const result = await getPublicHousingSupplies({
            page: 1,
            limit: 100,
            sortBy: 'rcritPblancDe',
            sortOrder: 'DESC',
            // 현재 진행 중이거나 예정된 공고만 필터링하여 가져옵니다.
            recruiting: true,
          });

          if (result.success && result.data) {
            setHousingData(result.data.items);
          }
        } catch (error) {
          console.error('🔍 [Bookmark] 공고 데이터 직접 조회 중 오류:', error);
        } finally {
          setIsApiLoading(false);
        }
      }
    };

    fetchNeededData();
  }, [housingData.length, setHousingData]);

  // 3. 전역 데이터(housingData)가 채워지거나 변경되었을 때, 북마크 ID에 부합하는 카드를 조립합니다.
  useEffect(() => {
    let savedBookmarkIds: string[] = [];
    try {
      const raw = localStorage.getItem(DETAIL_BOOKMARK_STORAGE_KEY);
      if (raw) {
        savedBookmarkIds = JSON.parse(raw);
      }
    } catch {
      // 오류 시 빈 배열 유지
    }

    if (
      !savedBookmarkIds ||
      savedBookmarkIds.length === 0 ||
      housingData.length === 0
    ) {
      setBookmarkItems([]);
      return;
    }

    const bookmarkedSet = new Set(savedBookmarkIds);

    // 북마크 ID에 매칭되는 진짜 공고 정보들만 가져옵니다.
    const filtered = housingData.filter((item) =>
      bookmarkedSet.has(String(item.id)),
    );

    // 카드로 렌더링하기 위해 HomeClient와 동일한 HousingItem 형태로 데이터를 매핑합니다.
    const mappedItems: HousingItem[] = filtered.map((item) => ({
      id: String(item.id),
      type: determineHousingType(item.rceptBgnde, item.rceptEndde),
      title: item.houseName || '-',
      // 민영 주택은 v1 스타일 가이드에 맞춰 APT로 표시
      subTitle:
        item.houseDtlSecdNm === '민영' ? 'APT' : item.houseDtlSecdNm || '-',
      region: item.subscrptAreaCodeNm || '-',
      area: '-',
      price: '공고문 확인',
      regularDate: formatDateRange(item.rceptBgnde, item.rceptEndde),
      specialDate: formatDateString(item.spsplyRceptBgnde),
    }));

    setBookmarkItems(mappedItems);
  }, [housingData]);

  // Next.js 하이드레이션 타이밍 이슈(서버와 브라우저 환경 차이)를 예방하기 위해 마운트 이전에는 로딩 스피너를 보여줍니다.
  if (!isMounted) {
    return (
      <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-4rem)] bg-[#f8faff] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-4rem)] bg-[#f8faff] items-center">
      <div className="w-full max-w-3xl px-4 shrink-0 mt-8">
        <h1
          className="text-xl font-bold font-pyeongchang text-black"
          style={{ marginBottom: '0px' }}
        >
          북마크
        </h1>
      </div>
      <HousingListSection
        items={bookmarkItems}
        isLoading={isApiLoading}
        alignLeft={true} // 북마크 리스트가 적은 경우에도 그리드가 왼쪽 정렬되도록 설정
        emptyMessage={
          !hasBookmarks
            ? '저장한 북마크가 없습니다.'
            : '북마크 정보를 불러오는 데 실패했습니다.'
        }
      />
    </div>
  );
}
