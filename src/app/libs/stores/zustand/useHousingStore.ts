import { create } from 'zustand';
import { HousingSupplyResponseDto } from 'byzip-v2-sdk';

/**
 * 분양 공고 정보 스토어의 상태(State) 및 액션(Action) 정의 인터페이스
 */
interface HousingState {
  /**
   * 홈 페이지에서 로드한 전체 분양 공고 리스트
   */
  housingData: HousingSupplyResponseDto[];
  /**
   * 전체 분양 공고 리스트를 전역 스토어에 저장하는 액션 함수
   * @param data - 서버로부터 가져온 전체 분양 공고 데이터 리스트
   */
  setHousingData: (data: HousingSupplyResponseDto[]) => void;
}

/**
 * 분양 공고 정보(Housing Supplies)의 공유 및 캐싱을 담당하는 Zustand 전역 스토어
 * - 홈 화면에서 로드된 API 데이터를 보관하여, 상세/북마크 페이지 등에서 API 재호출 없이 가공하여 사용할 수 있게 지원합니다.
 */
export const useHousingStore = create<HousingState>((set) => ({
  housingData: [],
  setHousingData: (data) => set({ housingData: data }),
}));
