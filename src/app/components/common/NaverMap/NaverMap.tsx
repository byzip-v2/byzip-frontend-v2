'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { MapPinOff } from 'lucide-react';
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
  const router = useRouter();

  // 지도의 단일 정보창(InfoWindow) 인스턴스를 재사용하기 위한 ref
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);

  // 지도 인스턴스를 상태로 관리하여, 인스턴스가 생성된 후 마커 렌더링 Effect가 실행되도록 함
  const [map, setMap] = React.useState<naver.maps.Map | null>(null);

  // 네이버 지도 SDK 스크립트 로딩 중 발생한 에러 여부를 관리하기 위한 상태
  const [mapError, setMapError] = useState<boolean>(false);

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
    // 이미 스크립트 로드 실패 판정을 받았거나, window.naver 객체가 아직 생성되지 않았거나, 컨테이너 DOM이 마운트되지 않은 경우 지도 초기화를 취소합니다.
    if (
      typeof window === 'undefined' ||
      mapError ||
      !window.naver ||
      !window.naver.maps ||
      !containerRef.current
    )
      return;

    // 이미 지도가 초기화되었다면 중복 생성 방지
    if (!map) {
      try {
        const newMap = new naver.maps.Map(containerRef.current, {
          center: new naver.maps.LatLng(resolvedCenter.lat, resolvedCenter.lng),
          zoom: resolvedZoom,
          zoomControl: true,
          zoomControlOptions: {
            position: naver.maps.Position.TOP_RIGHT,
          },
        });
        setMap(newMap);

        // (한국어) 툴팁으로 활용할 커스텀 정보창(InfoWindow)을 지도 초기화 시점에 생성해 둡니다.
        const newInfoWindow = new naver.maps.InfoWindow({
          content: '',
          borderWidth: 0,
          backgroundColor: 'transparent',
          disableAnchor: true,
          pixelOffset: new naver.maps.Point(0, -1), // 마커 상단 머리 위에 살짝 떨어지도록 배치
        });
        infoWindowRef.current = newInfoWindow;
      } catch (error) {
        console.error('[NaverMap] 네이버 지도 인스턴스 초기화 중 에러 발생:', error);
        setMapError(true);
      }
    }
  }, [resolvedCenter.lat, resolvedCenter.lng, resolvedZoom, map, mapError]);

  // 컴포넌트 마운트 시 또는 SDK 로드 시 지도 초기화 시도
  useEffect(() => {
    // 스크립트 에러 상황이 아닐 때만 지도를 초기화합니다.
    if (
      typeof window !== 'undefined' &&
      !mapError &&
      window.naver &&
      window.naver.maps
    ) {
      initMap();
    }
  }, [initMap, mapError]);

  /**
   * 마커가 없을 때만 페이지 기본 뷰(스토어 또는 props)를 지도에 반영합니다.
   * 마커가 있으면 아래 마커 effect가 fitBounds/단일 마커 줌을 담당하므로 여기서는 건드리지 않습니다.
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !map || !window.naver?.maps) return;
    if (markers.length > 0) return;

    try {
      map.setCenter(
        new naver.maps.LatLng(resolvedCenter.lat, resolvedCenter.lng),
      );
      map.setZoom(resolvedZoom);
    } catch (e) {
      console.warn('[NaverMap] Failed to set map center/zoom:', e);
    }
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
    // 지도 객체가 유효하지 않거나 에러 상태이면 마커 렌더링 작업을 건너뜁니다.
    if (mapError || !map || !window.naver || !window.naver.maps) return;

    let cancelled = false;

    try {
      // 1. 기존 클러스터러 및 마커 정리
      if (clustererRef.current) {
        try {
          clustererRef.current.setMap(null);
        } catch (e) {
          console.warn('[NaverMap] Failed to clear clusterer map:', e);
        }
        clustererRef.current = null;
      }
      markersRef.current.forEach((marker) => {
        try {
          marker.setMap(null);
        } catch (e) {
          console.warn('[NaverMap] Failed to clear marker map:', e);
        }
      });
      markersRef.current = [];

      // 표시할 데이터가 없으면 종료 (클러스터 스크립트는 불러오지 않음)
      if (markers.length === 0) return;

      // 2. 새로운 마커 객체 생성 (지도에는 직접 연결하지 않고 클러스터러에 전달)
      const newMarkers = markers
        .filter((m) => m.lat && m.lng)
        .map((m) => {
          // (한국어) 마커 타입별로 상응하는 Apply_ 아이콘 이미지 경로를 매핑합니다.
          let iconUrl = '/images/icons/Apply_today.png';
          if (m.type === 'coming') {
            iconUrl = '/images/icons/Apply_upcomming.png';
          } else if (m.type === 'random') {
            iconUrl = '/images/icons/Apply_random.png';
          }
          // (한국어) 기획 및 이미지 비율(222x193)에 맞게 마커의 크기를 75x65로 조절하고, 
          // 내부에 분양 유형 명칭(houseSecdNm)을 텍스트로 노출하기 위해 HTML 마커(content)를 사용합니다.
          const markerWidth = 75;
          const markerHeight = 65;

          // (한국어) 주택 공급 유형 명칭에 따른 마커 텍스트 단축 처리:
          let markerText = m.houseSecdNm || '';
          if (markerText === '신혼희망타운') {
            markerText = '신희타';
          } else if (markerText === '오피스텔/빌라') {
            markerText = '오피스텔';
          }

          const marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(m.lat, m.lng),
            title: m.title,
            // (한국어) 핀 마커 이미지 위에 주택 공급 유형 텍스트(예: '임대', '무순위' 등)가 얹어지도록 HTML 구조를 생성합니다.
            icon: {
              content: `
                <div style="position:relative; width:${markerWidth}px; height:${markerHeight}px;">
                  <img src="${iconUrl}" style="width:100%; height:100%; display:block;" />
                  <div style="position:absolute; top:60%; left:50%; transform:translate(-50%, -50%); font-size:13px; font-weight:600; color:#000000; text-align:center; white-space:nowrap; font-family:'Pretendard', sans-serif; letter-spacing:-0.5px;">
                    ${markerText}
                  </div>
                </div>
              `,
              size: new naver.maps.Size(markerWidth, markerHeight),
              anchor: new naver.maps.Point(markerWidth / 2, markerHeight), // 핀 하단의 중앙 뾰족한 꼬리 부분을 앵커 포인트로 설정
            },
          });

          // (한국어) 마커 마우스 오버 시 상단에 깔끔한 사각형 형태의 말풍선 정보창(툴팁)을 표시합니다.
          naver.maps.Event.addListener(marker, 'mouseover', () => {
            if (!infoWindowRef.current || !map) return;

            // 접수 시작일과 종료일 날짜 포맷팅 함수 정의
            const formatDate = (dateVal?: string | Date) => {
              if (!dateVal) return '';
              const date = new Date(dateVal);
              if (isNaN(date.getTime())) return '';
              return `${date.getMonth() + 1}월 ${date.getDate()}일`;
            };

            const startDateText = formatDate(m.rceptBgnde);
            const endDateText = formatDate(m.rceptEndde);
            const dateRange = startDateText && endDateText
              ? `${startDateText} ~ ${endDateText}`
              : '접수 기간 정보 없음';

            const infoContent = `
              <div style="padding: 12px 16px; border: 1px solid #CCCCCC; border-radius: 0px; background-color: #FFFFFF; text-align: center; font-family: 'Pretendard', sans-serif; box-shadow: none; min-width: 150px;">
                <div style="font-size: 13px; font-weight: 600; color: #000000; margin-bottom: 2px; white-space: nowrap; letter-spacing: -0.5px;">
                  ${m.title}
                </div>
                <div style="font-size: 12px; font-weight: 400; color: #374151; white-space: nowrap; letter-spacing: -0.5px;">
                  ${dateRange}
                </div>
              </div>
            `;

            infoWindowRef.current.setContent(infoContent);
            infoWindowRef.current.open(map, marker);
          });

          // (한국어) 마우스가 마커를 벗어나면 정보창을 즉시 닫습니다.
          naver.maps.Event.addListener(marker, 'mouseout', () => {
            if (infoWindowRef.current) {
              infoWindowRef.current.close();
            }
          });

          // (한국어) 마커를 클릭하면 해당 분양공고의 상세페이지로 라우팅 이동합니다.
          naver.maps.Event.addListener(marker, 'click', () => {
            router.push(`/detail/${m.id}`);
          });

          return marker;
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

      // (한국어) 생성된 마커들에 맞춰 지도의 영역을 자동으로 조정합니다.
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
          // 마커가 단 1개일 경우에는 마커가 있는 위치를 지도의 중심으로 두고 resolvedZoom 레벨로 고정합니다.
          try {
            map.setCenter(newMarkers[0].getPosition());
            map.setZoom(resolvedZoom);
          } catch (e) {
            console.warn('[NaverMap] Failed to set center for single marker:', e);
          }
        } else {
          // 마커가 여러 개일 경우에는 모든 마커가 화면 안에 다 들어올 수 있도록 지도의 경계를 맞춥니다(fitBounds).
          try {
            map.fitBounds(bounds);
          } catch (e) {
            console.warn('[NaverMap] Failed to fit bounds for multiple markers:', e);
          }
        }
      }

      loadMarkerClusteringModule()
        .then((MarkerClusteringClass) => {
          if (cancelled) return;
          try {
            // (한국어) 네이버 지도 라이브러리 인증 에러 등으로 지도 객체가 불완전할 때 MarkerClusteringClass 인스턴스를 생성하면
            // TypeError: Cannot read properties of null (reading 'capitalize') 등의 런타임 오류가 발생하므로 감쌉니다.
            clustererRef.current = new MarkerClusteringClass({
              // (한국어) 1개짜리 마커도 줌 레벨이 낮을 때는 클러스터 원 형태로 표시하기 위해 minClusterSize를 1로 유지합니다.
              minClusterSize: 1,
              // (한국어) 줌 레벨 8 이하에서는 클러스터가 동작하고, 9 이상(수도권 전체가 보이는 뷰)이 되면
              // 클러스터가 풀려 개별 마커들이 이미지처럼 큼직하게 보이도록 maxZoom을 8로 조정합니다.
              maxZoom: 10,
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
          } catch (err) {
            console.error('[NaverMap] MarkerClustering 인스턴스 생성 또는 setMap 실패:', err);
            setMapError(true);
          }
        })
        .catch((err) => {
          console.error('[NaverMap] MarkerClustering 모듈 로드 실패:', err);
          setMapError(true);
        });
    } catch (error) {
      console.error('[NaverMap] 마커 렌더링 및 클러스터링 적용 중 에러 발생:', error);
      setMapError(true);
    }

    return () => {
      cancelled = true;
      if (clustererRef.current) {
        try {
          clustererRef.current.setMap(null);
        } catch (e) {
          console.warn('[NaverMap] Failed to clear clusterer map on cleanup:', e);
        }
        clustererRef.current = null;
      }
      markersRef.current.forEach((marker) => {
        try {
          marker.setMap(null);
        } catch (e) {
          console.warn('[NaverMap] Failed to clear marker map on cleanup:', e);
        }
      });
      markersRef.current = [];
    };
  }, [map, markers, resolvedZoom, router, mapError]);

  return (
    <>
      {/* 네이버 지도 API 스크립트 로드 */}
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&submodules=geocoder`}
        strategy="afterInteractive"
        onReady={initMap} // 스크립트 로드 완료 시 초기화 함수 실행
        onError={(e) => {
          // 스크립트 로드 중 에러 발생 시 처리 (예: API Key 에러, 네트워크 끊김 등)
          console.error('[NaverMap] 네이버 지도 SDK 스크립트 로드 실패:', e);
          setMapError(true);
        }}
      />
      {/* 지도 로딩에 실패한 경우 보여줄 폴백(Fallback) UI */}
      {mapError ? (
        <div
          className={className}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            border: '1px solid #e5e7eb',
            color: '#6b7280',
            gap: '8px',
            fontFamily: "'Pretendard', sans-serif",
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          {/* 지도 로드 불가 대체 Lucide MapPinOff 아이콘 */}
          <MapPinOff size={32} style={{ color: '#9ca3af' }} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>네이버 지도 로드에 실패했습니다.</span>
        </div>
      ) : (
        /* 지도가 정상적으로 렌더링될 컨테이너 */
        <div
          ref={containerRef}
          className={className}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </>
  );
};

export default NaverMap;
