import { create } from 'zustand';

/**
 * 마커 정보 인터페이스
 */
export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  /** (한국어) 마커 타입: 오늘 청약('today'), 예정 청약('coming'), 무순위('random'), 전체('all') */
  type?: 'today' | 'coming' | 'random' | 'all';
  /** (한국어) 주택 공급 유형 명칭 (예: '임대', '민간분양' 등) */
  houseSecdNm?: string;
  /** (한국어) 청약 접수 시작일 (Date 객체 또는 YYYY-MM-DD 형식의 문자열) */
  rceptBgnde?: string | Date;
  /** (한국어) 청약 접수 종료일 (Date 객체 또는 YYYY-MM-DD 형식의 문자열) */
  rceptEndde?: string | Date;
}

/**
 * (한국어) 특정 라우트(페이지)에서 지도에 적용할 기본 중심점·줌.
 * - 레이아웃에 고정된 NaverMap이 자식 페이지의 설정을 구독할 수 있도록 전역에 둡니다.
 * - null이면 NaverMap에 넘긴 props(center, zoom)가 그대로 기본값으로 사용됩니다.
 */
export interface MapPageView {
  center: { lat: number; lng: number };
  zoom: number;
}

/**
 * (한국어) 페이지에서 별도 center/zoom을 지정하지 않았을 때 사용할 지도 기본 뷰.
 * - 레이아웃에 고정된 지도 컴포넌트가 항상 안정적인 초기 카메라를 가지도록 스토어 단계에서 기본값을 제공합니다.
 * - clearMapPageView() 호출 시에도 null로 비우지 않고 이 기본값으로 복원합니다.
 */
export const DEFAULT_MAP_PAGE_VIEW: MapPageView = {
  center: { lat: 37.5665, lng: 126.978 },
  zoom: 14,
};

interface MapState {
  markers: MapMarker[];
  setMarkers: (markers: MapMarker[]) => void;
  clearMarkers: () => void;
  /** 현재 페이지가 요청한 지도 기본 뷰(미지정 시 DEFAULT_MAP_PAGE_VIEW 사용) */
  mapPageView: MapPageView;
  setMapPageView: (view: MapPageView) => void;
  clearMapPageView: () => void;
}

/**
 * 네이버 지도와 통신하기 위한 Zustand 스토어
 * - 목록의 공고 데이터(좌표 등)를 지도 컴포넌트로 전달하는 역할을 합니다.
 * - mapPageView로 페이지별 기본 중심·줌을 전달합니다.
 */
export const useMapStore = create<MapState>((set) => ({
  markers: [],
  setMarkers: (markers) => set({ markers }),
  clearMarkers: () => set({ markers: [] }),
  mapPageView: DEFAULT_MAP_PAGE_VIEW,
  setMapPageView: (view) => set({ mapPageView: view }),
  clearMapPageView: () => set({ mapPageView: DEFAULT_MAP_PAGE_VIEW }),
}));
