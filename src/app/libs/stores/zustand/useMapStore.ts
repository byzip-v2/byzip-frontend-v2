import { create } from 'zustand';

/**
 * 마커 정보 인터페이스
 */
export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
}

interface MapState {
  markers: MapMarker[];
  setMarkers: (markers: MapMarker[]) => void;
  clearMarkers: () => void;
}

/**
 * 네이버 지도와 통신하기 위한 Zustand 스토어
 * - 목록의 공고 데이터(좌표 등)를 지도 컴포넌트로 전달하는 역할을 합니다.
 */
export const useMapStore = create<MapState>((set) => ({
  markers: [],
  setMarkers: (markers) => set({ markers }),
  clearMarkers: () => set({ markers: [] }),
}));
