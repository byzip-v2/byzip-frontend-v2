'use client';

import Toast from '@/app/components/common/Toast/Toast';
import Spinner from '@/app/components/common/Spinner/Spinner';
import AdminPageHeader from '@/app/pub/admin/AdminPageHeader';
import styles from '@/styles/pages/admin/geo/geo.module.scss';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';

export default function GeoPage() {
  const [toast, setToast] = useState<{
    msg: string;
    color: 'primary' | 'error';
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const showToast = (msg: string, color: 'primary' | 'error') => {
    setToast({ msg, color });
  };

  // 좌표 등록 버튼
  const handleAddCoordinate = async () => {
    try {
      // api 로직

      // 성공 시
      showToast('좌표가 성공적으로 추가되었습니다.', 'primary');
    } catch (error) {
      console.error(error);
      // 실패 시
      showToast('좌표 추가에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      // API 호출 자리
      await new Promise((resolve) => setTimeout(resolve, 800));
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      // 초기화 API 자리
      await new Promise((resolve) => setTimeout(resolve, 600));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="좌표 관리" />
      <div className={styles.pageContent}>
        {/* 지도 영역 */}
        <div className={styles.mapSection}>
          <div className={styles.mapHeader}>
            <div className={styles.searchSection}>
              <input
                type="text"
                placeholder="전북특별자치도 정읍시 수성2로 13-12(수성동) 주공1단지아파트"
                className={styles.searchInput}
              />
              <button
                className={`${styles.searchBtn} ${isSearching ? styles.searchBtnLoading : ''}`}
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? <Spinner /> : '좌표 검색'}
              </button>
            </div>
          </div>
          <div className={styles.mapContainer}>
            <div className={styles.mapPlaceholder}>
              🗺️ 지도 영역
              <div className={styles.mapNote}>네이버 지도 API 연동 예정</div>
            </div>
            <div className={styles.mapMarker} aria-hidden="true" />
            <div className={styles.mapOverlay}>
              <div className={styles.overlayContent}>
                <h3 className={styles.overlayTitle}>
                  [모집공고명] 군산소룡신도시
                </h3>
                <p className={styles.overlayAddress}>
                  도로명 주소: 전북특별자치도 정읍시 수성2로 13-12(수성동)
                  주공1단지아파트
                </p>
                <p className={styles.overlayCoordinates}>
                  위도: 37.5765261 / 경도: 126.9750486
                </p>
                <button
                  className={styles.addCoordinateBtn}
                  onClick={handleAddCoordinate}
                >
                  공고에 현재 좌표 추가하기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 데이터 테이블 영역 */}
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>
              좌표가 없는 공고 (<span>5</span>개)
            </h2>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <Spinner />
              ) : (
                <>
                  <RotateCcw size={16} /> 초기화
                </>
              )}
            </button>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>모집공고</th>
                  <th>주소</th>
                  <th>모집공고문 링크</th>
                  <th>버튼</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.highlightedRow}>
                  <td>군산소룡신도시</td>
                  <td>전북특별자치도 정읍시 수성2로 13-12</td>
                  <td>
                    <button className={styles.linkBtn}>링크</button>
                  </td>
                  <td>
                    <button className={styles.coordinateBtn}>좌표 찾기</button>
                  </td>
                </tr>
                <tr>
                  <td>군산신역세권 A-3블록 영구임대주택</td>
                  <td>전북특별자치도 군산시 사옥로 69(내흥동)</td>
                  <td>
                    <button className={styles.linkBtn}>링크</button>
                  </td>
                  <td>
                    <button className={styles.coordinateBtn}>좌표 찾기</button>
                  </td>
                </tr>
                <tr>
                  <td>포항블루밸리 행복주택</td>
                  <td>
                    경상북도 포항시 남구 동해면 블루동로2길 25 포항블루밸리
                    행복주택
                  </td>
                  <td>
                    <button className={styles.linkBtn}>링크</button>
                  </td>
                  <td>
                    <button className={styles.coordinateBtn}>좌표 찾기</button>
                  </td>
                </tr>
                <tr>
                  <td>포항블루밸리 행복주택</td>
                  <td>
                    경상북도 포항시 남구 동해면 블루동로2길 25 포항블루밸리
                    행복주택
                  </td>
                  <td>
                    <button className={styles.linkBtn}>링크</button>
                  </td>
                  <td>
                    <button className={styles.coordinateBtn}>좌표 찾기</button>
                  </td>
                </tr>
                <tr>
                  <td>포항블루밸리 행복주택</td>
                  <td>
                    경상북도 포항시 남구 동해면 블루동로2길 25 포항블루밸리
                    행복주택
                  </td>
                  <td>
                    <button className={styles.linkBtn}>링크</button>
                  </td>
                  <td>
                    <button className={styles.coordinateBtn}>좌표 찾기</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* 토스트 알림 */}
      {toast && (
        <Toast key={Date.now()} message={toast.msg} color={toast.color} />
      )}
    </div>
  );
}
