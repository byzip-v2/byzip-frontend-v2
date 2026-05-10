'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import {
  DEFAULT_MAP_PAGE_VIEW,
  useMapStore,
} from '@/app/libs/stores/zustand/useMapStore';

/**
 * public/js/MarkerClustering.js 가 전역 스크립트로 실행되면 `var MarkerClustering` 이
 * window에 노출됩니다. @types/navermaps 에 없어 최소 필드만 선언합니다.
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
 * MarkerClustering 스크립트를 한 번만 주입·재사용하기 위한 캐시.
 * 네이버 maps.js 로드(맵 인스턴스 생성) 이후에만 호출해야 합니다.
 */
let markerClusteringLoadPromise: Promise<NaverMarkerClusteringConstructor> | null =
  null;

/**
 * 맵이 준비된 뒤 클러스터 라이브러리만 동적으로 불러옵니다.
 * - `<Script src="/js/MarkerClustering.js">` 로 초기 HTML과 병렬 요청하지 않고,
 *   마커가 필요할 때 `<script>` 태그를 한 번 넣어 전역 MarkerClustering 을 채웁니다.
 */
function loadMarkerClusteringModule(): Promise<NaverMarkerClusteringConstructor> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('MarkerClustering: window unavailable'));
  }
  const w = window as WindowWithMarkerClustering;
  if (w.MarkerClustering) {
    return Promise.resolve(w.MarkerClustering);
  }
  if (!markerClusteringLoadPromise) {
    markerClusteringLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/js/MarkerClustering.js';
      script.async = true;
      script.onload = () => {
        const Ctor = (window as WindowWithMarkerClustering).MarkerClustering;
        if (Ctor) {
          resolve(Ctor);
        } else {
          markerClusteringLoadPromise = null;
          reject(
            new Error(
              'MarkerClustering: global constructor missing after load',
            ),
          );
        }
      };
      script.onerror = () => {
        markerClusteringLoadPromise = null;
        reject(new Error('MarkerClustering: script load failed'));
      };
      document.head.appendChild(script);
    });
  }
  return markerClusteringLoadPromise;
}

/**
 * NaverMap 컴포넌트 속성 인터페이스
 */
interface NaverMapProps {
  /** 지도의 추가 스타일링을 위한 클래스명 (width, height, border 등) */
  className?: string;
  /**
   * 지도의 폴백 중심 좌표.
   * - 페이지에서 mapPageView를 설정하지 않았을 때는 스토어 기본값(DEFAULT_MAP_PAGE_VIEW.center)이 우선됩니다.
   * - 이 props는 특정 레이아웃에서 임시 override가 필요할 때만 사용합니다.
   */
  center?: { lat: number; lng: number };
  /**
   * 지도의 폴백 확대 레벨.
   * - 페이지 미지정 시 스토어 기본값(DEFAULT_MAP_PAGE_VIEW.zoom)을 우선합니다.
   * - 이 props는 특정 레이아웃에서 임시 override가 필요할 때만 사용합니다.
   */
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
 * - 페이지별 기본 중심·줌은 `useMapPageView(center, zoom)` 또는 `setMapPageView`로 등록합니다.
 * - 이 컴포넌트 내부에서 마커 생성 로직이 자동으로 실행됩니다.
 */
const NaverMap = ({
  className,
  center = DEFAULT_MAP_PAGE_VIEW.center,
  zoom = DEFAULT_MAP_PAGE_VIEW.zoom,
}: NaverMapProps) => {
  // 지도 인스턴스를 상태로 관리하여, 인스턴스가 생성된 후 마커 렌더링 Effect가 실행되도록 함
  const [map, setMap] = React.useState<naver.maps.Map | null>(null);

  // 지도가 그려질 DOM 요소 참조
  const containerRef = useRef<HTMLDivElement>(null);

  // 현재 지도에 표시 중인 마커 객체들을 관리 (클러스터링 대상)
  const markersRef = useRef<naver.maps.Marker[]>([]);

  // 클러스터링 인스턴스 관리
  const clustererRef = useRef<naver.maps.OverlayView | null>(null);

  // 전역 스토어: 마커 + 페이지별 기본 뷰(중심·줌)
  const { markers, mapPageView } = useMapStore();

  /**
   * 스토어에 페이지 뷰가 있으면 우선하고, 없으면 레이아웃에 넘긴 props를 씁니다.
   * 이렇게 해야 레이아웃 단일 NaverMap으로 라우트마다 다른 기본 카메라를 줄 수 있습니다.
   */
  const resolvedCenter = mapPageView.center ?? center;
  const resolvedZoom = mapPageView.zoom ?? zoom;

  /**
   * 네이버 지도 SDK를 사용하여 지도 인스턴스를 생성하는 함수
   */
  const initMap = React.useCallback(() => {
    if (typeof window === 'undefined' || !window.naver || !containerRef.current)
      return;

    // 이미 지도가 초기화되었다면 중복 생성 방지
    if (!map) {
      const newMap = new naver.maps.Map(containerRef.current, {
        center: new naver.maps.LatLng(resolvedCenter.lat, resolvedCenter.lng),
        zoom: resolvedZoom,
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.TOP_RIGHT,
        },
      });
      setMap(newMap);
    }
  }, [resolvedCenter.lat, resolvedCenter.lng, resolvedZoom, map]);

  // 컴포넌트 마운트 시 또는 SDK 로드 시 지도 초기화 시도
  useEffect(() => {
    if (typeof window !== 'undefined' && window.naver && window.naver.maps) {
      initMap();
    }
  }, [initMap]);

  /**
   * 마커가 없을 때만 페이지 기본 뷰(스토어 또는 props)를 지도에 반영합니다.
   * 마커가 있으면 아래 마커 effect가 fitBounds/단일 마커 줌을 담당하므로 여기서는 건드리지 않습니다.
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !map || !window.naver?.maps) return;
    if (markers.length > 0) return;

    map.setCenter(
      new naver.maps.LatLng(resolvedCenter.lat, resolvedCenter.lng),
    );
    map.setZoom(resolvedZoom);
  }, [
    map,
    markers.length,
    resolvedCenter.lat,
    resolvedCenter.lng,
    resolvedZoom,
  ]);

  /**
   * 전역 스토어의 markers 데이터가 변경될 때마다 지도에 마커 및 클러스터링을 업데이트하는 Effect
   * 클러스터 라이브러리는 maps.js 이후에만 의미가 있으므로, 맵이 준비된 뒤 동적 로드합니다(버전1과 동일한 순서).
   */
  useEffect(() => {
    if (!map || !window.naver || !window.naver.maps) return;

    // 1. 기존 클러스터러 및 마커 정리
    if (clustererRef.current) {
      clustererRef.current.setMap(null);
      clustererRef.current = null;
    }
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // 표시할 데이터가 없으면 종료 (클러스터 스크립트는 불러오지 않음)
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

    // 3. 클러스터링용 아이콘 (UI 스펙: 파란 원 + 단계별 크기·글자)
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
    let currentBaseZoom = resolvedZoom;
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
        map.setZoom(resolvedZoom);
        currentBaseZoom = resolvedZoom;
      } else {
        map.fitBounds(bounds);
        currentBaseZoom = map.getZoom();
      }
    }

    // 비동기 로드가 끝난 뒤에도 이 effect가 이미 정리됐으면 클러스터를 붙이지 않습니다.
    let cancelled = false;
    loadMarkerClusteringModule()
      .then((MarkerClusteringClass) => {
        if (cancelled) return;
        clustererRef.current = new MarkerClusteringClass({
          minClusterSize: 1,
          maxZoom: currentBaseZoom + 2,
          map: map,
          markers: newMarkers,
          disableClickZoom: false,
          gridSize: 120,
          icons: clusterIcons,
          indexGenerator: [2, 5, 10, 30, 100],
          stylingFunction: (
            clusterMarker: naver.maps.Marker,
            count: number,
          ) => {
            const element = clusterMarker.getElement();
            const div = element.querySelector('div');
            if (div) div.innerText = count.toString();
          },
        });
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[NaverMap] MarkerClustering load failed:', err);
        }
      });

    return () => {
      cancelled = true;
      if (clustererRef.current) {
        clustererRef.current.setMap(null);
        clustererRef.current = null;
      }
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [map, markers, resolvedZoom]);

  return (
    <>
      {/* 네이버 지도 API 스크립트 로드 */}
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&submodules=geocoder`}
        strategy="afterInteractive"
        onReady={initMap} // 스크립트 로드 완료 시 초기화 함수 실행
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
