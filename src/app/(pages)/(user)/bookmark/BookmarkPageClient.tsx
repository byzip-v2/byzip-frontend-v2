'use client';

import React, { useEffect, useState } from 'react';
import HousingListSection from '@/app/(pages)/(user)/global/components/HousingListSection';
import { getPublicHousingSupplies } from '@/app/(pages)/(user)/(with-map)/actions';
import { useHousingStore } from '@/app/libs/stores/zustand/useHousingStore';
import Spinner from '@/app/components/common/Spinner/Spinner';
import { HousingSupplyResponseDto } from 'byzip-v2-sdk';

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

  // 북마크에 추가된 청약 공고 원본 데이터 리스트를 저장하는 상태입니다.
  const [bookmarkedData, setBookmarkedData] = useState<HousingSupplyResponseDto[]>([]);

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
      setBookmarkedData([]);
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

  // 3. 전역 데이터(housingData)가 채워지거나 변경되었을 때, 로컬 스토리지에 저장된 북마크 ID와 매치되는 데이터를 필터링합니다.
  // UI 렌더링용 매핑 작업은 HousingListSection 컴포넌트 내부에서 자동 수행되므로, 여기서는 원본 DTO 데이터만 필터링해 저장합니다.
  useEffect(() => {
    let savedBookmarkIds: string[] = [];
    try {
      const raw = localStorage.getItem(DETAIL_BOOKMARK_STORAGE_KEY);
      if (raw) {
        savedBookmarkIds = JSON.parse(raw);
      }
    } catch {
      // 오류 상황 시 빈 배열을 유지하도록 처리합니다.
    }

    if (
      !savedBookmarkIds ||
      savedBookmarkIds.length === 0 ||
      housingData.length === 0
    ) {
      setBookmarkedData([]);
      return;
    }

    const bookmarkedSet = new Set(savedBookmarkIds);

    // 저장된 북마크 ID 목록에 포함되는 청약 공고 데이터들만 필터링합니다.
    const filtered = housingData.filter((item) =>
      bookmarkedSet.has(String(item.id)),
    );

    setBookmarkedData(filtered);
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
        housingData={bookmarkedData}
        isLoading={isApiLoading}
        emptyMessage={
          !hasBookmarks
            ? '저장한 북마크가 없습니다.'
            : '북마크 정보를 불러오는 데 실패했습니다.'
        }
      />
    </div>
  );
}
