'use client';

import Toast from '@/app/components/common/Toast/Toast';
import styles from '@/styles/pages/admin/geo/geo.module.scss';
import { useState } from 'react';

interface TableData {
  id: number;
  title: string;
  address: string;
  link: string;
}

export default function GeoPage() {
  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'error';
  } | null>(null);

  const [searchAddress, setSearchAddress] = useState<string>('');
  const [showMapOverlay, setShowMapOverlay] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState<TableData | null>(null);

  // 테이블 데이터
  const [tableData] = useState<TableData[]>([
    {
      id: 1,
      title: '군산소룡신도시',
      address: '전북특별자치도 정읍시 수성2로 13-12',
      link: 'https://example.com',
    },
    {
      id: 2,
      title: '군산신역세권 A-3블록 영구임대주택',
      address: '전북특별자치도 군산시 사옥로 69(내흥동)',
      link: 'https://example.com',
    },
    {
      id: 3,
      title: '포항블루밸리 행복주택',
      address:
        '경상북도 포항시 남구 동해면 블루동로2길 25 포항블루밸리 행복주택',
      link: 'https://example.com',
    },
    {
      id: 4,
      title: '신원아침도시',
      address:
        '경상남도 양산시 대평들5길 16(주남동,웅상신원아침도시아파트)',
      link: 'https://example.com',
    },
    {
      id: 5,
      title: '성남판교 산운마을13단지',
      address:
        '경기도 성남시 분당구 판교원로82번길 30 (산운마을)',
      link: 'https://example.com',
    },
  ]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
  };

  // 좌표 찾기 버튼 클릭 핸들러
  const handleCoordinateSearch = (data: TableData) => {
    setSearchAddress(data.address);
    setSelectedData(data);
    setShowMapOverlay(true);
  };

  // 좌표 등록 버튼
  const handleAddCoordinate = async () => {
    try {
      // api 로직

      // 성공 시
      showToast('좌표가 성공적으로 추가되었습니다.', 'success');
    } catch (error) {
      console.error(error);
      // 실패 시
      showToast('좌표 추가에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  };

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
                placeholder="주소를 입력해 주세요."
                className={styles.searchInput}
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
              />
              <button className={styles.searchBtn}>좌표 검색</button>
            </div>
          </div>
          <div className={styles.mapContainer}>
            <div className={styles.mapPlaceholder}>
              🗺️ 지도 영역
              <div className={styles.mapNote}>네이버 지도 API 연동 예정</div>
            </div>
            {showMapOverlay && selectedData && (
              <div className={styles.mapOverlay}>
                <div className={styles.overlayContent}>
                  <h3 className={styles.overlayTitle}>
                    [모집공고명] {selectedData.title}
                  </h3>
                  <p className={styles.overlayAddress}>
                    도로명 주소: {selectedData.address}
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
            )}
          </div>
        </div>

        {/* 데이터 테이블 영역 */}
        <div className={styles.tableSection}>
          <h2 className={styles.tableTitle}>
            좌표가 없는 공고 (<span>{tableData.length}</span>개)
          </h2>
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>모집공고명</th>
                  <th>주소</th>
                  <th>모집공고문</th>
                  <th>좌표 찾기</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((data, index) => (
                  <tr
                    key={data.id}
                    className={index === 0 ? styles.highlightedRow : ''}
                  >
                    <td>{data.title}</td>
                    <td>{data.address}</td>
                    <td>
                      <button className={styles.linkBtn}>링크</button>
                    </td>
                    <td>
                      <button
                        className={styles.coordinateBtn}
                        onClick={() => handleCoordinateSearch(data)}
                      >
                        좌표 찾기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* 토스트 알림 */}
      {toast && (
        <Toast key={Date.now()} message={toast.msg} type={toast.type} />
      )}
    </div>
  );
}
