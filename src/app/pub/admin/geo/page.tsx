'use client';

import styles from '@/styles/pages/admin/geo/geo.module.scss';

export default function GeoPage() {
  return (
    <div className={styles.geoPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>좌표 관리</h1>
      </div>

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
              <button className={styles.searchBtn}>좌표 검색</button>
            </div>
          </div>
          <div className={styles.mapContainer}>
            <div className={styles.mapPlaceholder}>
              🗺️ 지도 영역
              <div className={styles.mapNote}>
                네이버 지도 API 연동 예정
              </div>
            </div>
            <div className={styles.mapOverlay}>
              <div className={styles.overlayContent}>
                <h3 className={styles.overlayTitle}>[모집공고명] 군산소룡신도시</h3>
                <p className={styles.overlayAddress}>
                  도로명 주소: 전북특별자치도 정읍시 수성2로 13-12(수성동) 주공1단지아파트
                </p>
                <p className={styles.overlayCoordinates}>
                  위도: 37.5765261 / 경도: 126.9750486
                </p>
                <button className={styles.addCoordinateBtn}>공고에 현재 좌표 추가하기</button>
              </div>
            </div>
          </div>
        </div>

        {/* 데이터 테이블 영역 */}
        <div className={styles.tableSection}>
          <h2 className={styles.tableTitle}>좌표가 없는 공고 (<span>5</span>개)</h2>
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
                  <td>경상북도 포항시 남구 동해면 블루동로2길 25 포항블루밸리 행복주택</td>
                  <td>
                    <button className={styles.linkBtn}>링크</button>
                  </td>
                  <td>
                    <button className={styles.coordinateBtn}>좌표 찾기</button>
                  </td>
                </tr>
                <tr>
                  <td>포항블루밸리 행복주택</td>
                  <td>경상북도 포항시 남구 동해면 블루동로2길 25 포항블루밸리 행복주택</td>
                  <td>
                    <button className={styles.linkBtn}>링크</button>
                  </td>
                  <td>
                    <button className={styles.coordinateBtn}>좌표 찾기</button>
                  </td>
                </tr>
                <tr>
                  <td>포항블루밸리 행복주택</td>
                  <td>경상북도 포항시 남구 동해면 블루동로2길 25 포항블루밸리 행복주택</td>
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
    </div>
  );
}