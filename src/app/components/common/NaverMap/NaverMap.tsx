'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useMapStore } from '@/app/libs/stores/zustand/useMapStore';

/**
 * public/js/MarkerClustering.js 가 window에 올리는 전역 클래스용 타입.
 * @types/navermaps 에 없어 no-explicit-any 대신 최소 필드만 선언한다.
 */
type NaverMarkerClusteringOptions = {
  minClusterSize: number;
  maxZoom: number;
  map: naver.maps.Map;
  markers: naver.maps.Marker[];
  disableClickZoom: boolean;
  gridSize: number;
  icons: Array<{
    content: string;
    size: naver.maps.Size;
    anchor: naver.maps.Point;
  }>;
  indexGenerator: number[];
  stylingFunction?: (clusterMarker: naver.maps.Marker, count: number) => void;
};

type NaverMarkerClusteringConstructor = new (
  options: NaverMarkerClusteringOptions,
) => naver.maps.OverlayView;

type WindowWithMarkerClustering = Window & {
  MarkerClustering?: NaverMarkerClusteringConstructor;
};

/**
 * NaverMap 컴포넌트 속성 인터페이스
 */
interface NaverMapProps {
  /** 지도의 추가 스타일링을 위한 클래스명 (width, height, border 등) */
  className?: string;
  /** 지도가 처음 렌더링될 때의 중심 좌표 (기본값: 서울 시청) */
  center?: { lat: number; lng: number };
  /** 지도의 초기 확대 레벨 (기본값: 13) */
  zoom?: number;
}

/**
 * NaverMap 공통 컴포넌트
 *
 * [주요 기능]
 * 1. 네이버 지도 SDK 로드 및 지도 인스턴스 초기화
 * 2. 전역 스토어(useMapStore)의 `markers` 데이터를 구독하여 자동으로 지도 위에 마커를 렌더링
 * 3. 마커 개수에 따라 지도의 중심을 이동하거나, 모든 마커가 보이도록 영역 자동 조정(fitBounds)
 *
 * [사용 방법]
 * - 지도 위에 마커를 표시하고 싶다면, 이 컴포넌트를 사용하는 페이지(Client Component)에서
 *   `useMapStore`의 `setMarkers` 함수를 사용하여 마커 배열을 업데이트하세요.
 * - 이 컴포넌트 내부에서 마커 생성 로직이 자동으로 실행됩니다.
 */
const NaverMap = ({
  className,
  center = { lat: 37.5665, lng: 126.978 }, // 기본 서울 중심
  zoom = 15,
}: NaverMapProps) => {
  // 지도 인스턴스를 상태로 관리하여, 인스턴스가 생성된 후 마커 렌더링 Effect가 실행되도록 함
  const [map, setMap] = React.useState<naver.maps.Map | null>(null);

  // 클러스터링 라이브러리 로드 여부
  const [isClusteringLoaded, setIsClusteringLoaded] = React.useState(false);

  // 지도가 그려질 DOM 요소 참조
  const containerRef = useRef<HTMLDivElement>(null);

  // 현재 지도에 표시 중인 마커 객체들을 관리 (클러스터링 대상)
  const markersRef = useRef<naver.maps.Marker[]>([]);

  // 클러스터링 인스턴스 관리
  const clustererRef = useRef<naver.maps.OverlayView | null>(null);

  // 전역 스토어에서 마커 데이터를 가져옴
  const { markers } = useMapStore();

  /**
   * 네이버 지도 SDK를 사용하여 지도 인스턴스를 생성하는 함수
   */
  const initMap = React.useCallback(() => {
    if (typeof window === 'undefined' || !window.naver || !containerRef.current)
      return;

    // 이미 지도가 초기화되었다면 중복 생성 방지
    if (!map) {
      const newMap = new naver.maps.Map(containerRef.current, {
        center: new naver.maps.LatLng(center.lat, center.lng),
        zoom: zoom,
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.TOP_RIGHT,
        },
      });
      setMap(newMap);
    }
  }, [center.lat, center.lng, zoom, map]);

  // 컴포넌트 마운트 시 또는 SDK 로드 시 지도 초기화 시도
  useEffect(() => {
    if (typeof window !== 'undefined' && window.naver && window.naver.maps) {
      initMap();
    }
  }, [initMap]);

  /**
   * 전역 스토어의 markers 데이터가 변경될 때마다 지도에 마커 및 클러스터링을 업데이트하는 Effect
   */
  useEffect(() => {
    // 지도 인스턴스나 네이버 객체, 또는 클러스터링 라이브러리가 로드되지 않았으면 대기
    if (!map || !window.naver || !window.naver.maps || !isClusteringLoaded)
      return;

    // 1. 기존 클러스터러 및 마커 정리
    if (clustererRef.current) {
      clustererRef.current.setMap(null);
      clustererRef.current = null;
    }
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // 표시할 데이터가 없으면 종료
    if (markers.length === 0) return;

    // 2. 새로운 마커 객체 생성 (지도에는 직접 연결하지 않고 클러스터러에 전달)
    const newMarkers = markers
      .filter((m) => m.lat && m.lng)
      .map((m) => {
        return new naver.maps.Marker({
          position: new naver.maps.LatLng(m.lat, m.lng),
          title: m.title,
          // 개별 마커는 네이버 기본 마커(핀)를 사용하도록 아이콘 설정 제거
        });
      });

    markersRef.current = newMarkers;

    // 3. 클러스터링 적용
    // 이미지 UI와 동일하게 파란색 원형 스타일 정의 (숫자: font-weight +100, font-size는 16px부터 단계마다 +1px)
    const clusterIcons = [
      {
        content:
          '<div style="cursor:pointer;width:46px;height:46px;line-height:44px;font-size:16px;font-weight:500;color:#356EFF;text-align:center;background:rgba(222, 239, 255, 0.7);border:1.5px solid #356EFF;border-radius:50%;box-sizing:border-box;"></div>',
        size: new naver.maps.Size(46, 46),
        anchor: new naver.maps.Point(23, 23),
      },
      {
        content:
          '<div style="cursor:pointer;width:54px;height:54px;line-height:52px;font-size:17px;font-weight:500;color:#356EFF;text-align:center;background:rgba(222, 239, 255, 0.7);border:1.5px solid #356EFF;border-radius:50%;box-sizing:border-box;"></div>',
        size: new naver.maps.Size(54, 54),
        anchor: new naver.maps.Point(27, 27),
      },
      {
        content:
          '<div style="cursor:pointer;width:64px;height:64px;line-height:62px;font-size:18px;font-weight:500;color:#356EFF;text-align:center;background:rgba(222, 239, 255, 0.7);border:1.5px solid #356EFF;border-radius:50%;box-sizing:border-box;"></div>',
        size: new naver.maps.Size(64, 64),
        anchor: new naver.maps.Point(32, 32),
      },
      {
        content:
          '<div style="cursor:pointer;width:80px;height:80px;line-height:78px;font-size:19px;font-weight:500;color:#356EFF;text-align:center;background:rgba(222, 239, 255, 0.7);border:1.5px solid #356EFF;border-radius:50%;box-sizing:border-box;"></div>',
        size: new naver.maps.Size(80, 80),
        anchor: new naver.maps.Point(40, 40),
      },
      {
        content:
          '<div style="cursor:pointer;width:100px;height:100px;line-height:98px;font-size:20px;font-weight:500;color:#356EFF;text-align:center;background:rgba(222, 239, 255, 0.7);border:1.5px solid #356EFF;border-radius:50%;box-sizing:border-box;"></div>',
        size: new naver.maps.Size(100, 100),
        anchor: new naver.maps.Point(50, 50),
      },
      {
        content:
          '<div style="cursor:pointer;width:120px;height:120px;line-height:118px;font-size:21px;font-weight:500;color:#356EFF;text-align:center;background:rgba(222, 239, 255, 0.7);border:1.5px solid #356EFF;border-radius:50%;box-sizing:border-box;"></div>',
        size: new naver.maps.Size(120, 120),
        anchor: new naver.maps.Point(60, 60),
      },
    ];

    // 생성된 마커들에 맞춰 지도의 영역 조정 및 현재 줌 레벨 확인
    let currentBaseZoom = zoom;
    if (newMarkers.length > 0) {
      const bounds = new naver.maps.LatLngBounds(
        new naver.maps.LatLng(
          newMarkers[0].getPosition().y,
          newMarkers[0].getPosition().x,
        ),
        new naver.maps.LatLng(
          newMarkers[0].getPosition().y,
          newMarkers[0].getPosition().x,
        ),
      );

      newMarkers.forEach((marker) => {
        bounds.extend(marker.getPosition());
      });

      if (newMarkers.length === 1) {
        map.setCenter(newMarkers[0].getPosition());
        map.setZoom(15);
        currentBaseZoom = 15;
      } else {
        map.fitBounds(bounds);
        // fitBounds 이후의 실제 줌 레벨을 기본값으로 사용
        currentBaseZoom = map.getZoom();
      }
    }

    // global MarkerClustering 인스턴스 생성 (window 레이어의 MarkerClustering 사용)
    const MarkerClusteringClass = (window as WindowWithMarkerClustering)
      .MarkerClustering;
    if (MarkerClusteringClass) {
      clustererRef.current = new MarkerClusteringClass({
        minClusterSize: 1, // 1개라도 무조건 클러스터(원형 UI)로 표시하여 마커와 혼용되지 않도록 함
        maxZoom: currentBaseZoom + 2, // 실제 초기 줌 레벨에서 2단계 더 들어갔을 때부터 클러스터 해제
        map: map,
        markers: newMarkers,
        disableClickZoom: false,
        gridSize: 120,
        icons: clusterIcons,
        indexGenerator: [2, 5, 10, 30, 100],
        stylingFunction: (clusterMarker: naver.maps.Marker, count: number) => {
          const element = clusterMarker.getElement();
          const div = element.querySelector('div');
          if (div) div.innerText = count.toString();
        },
      });
    }
  }, [map, markers, isClusteringLoaded, zoom]);

  return (
    <>
      {/* 네이버 지도 API 스크립트 로드 */}
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&submodules=geocoder`}
        strategy="afterInteractive"
        onReady={initMap} // 스크립트 로드 완료 시 초기화 함수 실행
      />
      {/* 클러스터링 확장 라이브러리 로드 */}
      <Script
        src="/js/MarkerClustering.js"
        strategy="afterInteractive"
        onReady={() => setIsClusteringLoaded(true)}
      />
      {/* 지도가 렌더링될 컨테이너 */}
      <div
        ref={containerRef}
        className={className}
        style={{ width: '100%', height: '100%' }}
      />
    </>
  );
};

export default NaverMap;
