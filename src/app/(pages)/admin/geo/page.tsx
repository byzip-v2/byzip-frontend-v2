'use client';

import styles from '@/styles/pages/admin/geo/geo.module.scss';
import Script from 'next/script';
import { useRef, useState } from 'react';
import { renderToString } from 'react-dom/server';

interface TableData {
  id: number;
  title: string;
  address: string;
  link: string;
}

// InfoWindow용 JSX 컴포넌트
const InfoWindowContent = () => (
  <div className={styles.mapOverlay}>
    <div className={styles.overlayContent}>
      <h3 className={styles.overlayTitle}>[모집공고명] 군산소룡신도시</h3>
      <p className={styles.overlayAddress}>
        도로명 주소: 전북특별자치도 정읍시 수성2로 13-12(수성동) 주공1단지아파트
      </p>
      <p className={styles.overlayCoordinates}>
        위도: 37.5765261 / 경도: 126.9750486
      </p>
      <button className={styles.addCoordinateBtn}>
        공고에 현재 좌표 추가하기
      </button>
    </div>
  </div>
);

export default function GeoPage() {
  const mapRef = useRef<naver.maps.Map | null>(null);
  const infowindowRef = useRef<naver.maps.InfoWindow | null>(null);

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
      address: '경상남도 양산시 대평들5길 16(주남동,웅상신원아침도시아파트)',
      link: 'https://example.com',
    },
    {
      id: 5,
      title: '성남판교 산운마을13단지',
      address: '경기도 성남시 분당구 판교원로82번길 30 (산운마을)',
      link: 'https://example.com',
    },
  ]);

  const [searchAddress, setSearchAddress] = useState<string>('');
  const [showMapOverlay, setShowMapOverlay] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState<TableData | null>(null);

  // 네이버 지도 API 로드 확인
  const checkNaverMapsLoaded = () => {
    return (
      typeof window !== 'undefined' &&
      typeof window.naver !== 'undefined' &&
      window.naver.maps
    );
  };

  // 지도 초기화
  const initializeMap = () => {
    if (!checkNaverMapsLoaded()) {
      console.error('네이버 지도 API가 로드되지 않았습니다.');
      return;
    }

    mapRef.current = new naver.maps.Map('map', {
      center: new naver.maps.LatLng(37.3595316, 127.1052133),
      zoom: 15,
    });

    // InfoWindow 초기화
    infowindowRef.current = new naver.maps.InfoWindow({
      content: '',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      disableAnchor: true,
      // anchorColor: 'red',
      // anchorSize: new naver.maps.Size(30, 5),
      // pixelOffset: new naver.maps.Point(0, -50),
    });

    // 지도 클릭 시 마커 이동 및 좌표 표시
    mapRef.current.addListener('click', (e: { coord: naver.maps.LatLng }) => {
      const latlng = e.coord;
      searchCoordinateToAddress(latlng);
    });
  };

  // 주소 검색 시 좌표로 변환
  const searchAddressToCoordinate = () => {
    if (!searchAddress.trim()) return;

    if (!checkNaverMapsLoaded()) {
      console.error('네이버 지도 API가 로드되지 않았습니다.');
      return;
    }

    naver.maps.Service.geocode({ query: searchAddress }, (status, response) => {
      if (status === naver.maps.Service.Status.ERROR) {
        alert('주소를 찾을 수 없습니다.');
        return;
      }

      if (response.v2.meta.totalCount === 0) {
        alert('주소를 찾을 수 없습니다.');
        return;
      }

      const item = response.v2.addresses[0];
      const point = new naver.maps.LatLng(
        parseFloat(item.y),
        parseFloat(item.x),
      );

      mapRef.current?.setCenter(point);

      // mapOverlay가 표시되어 있다면 좌표 정보 업데이트
      if (showMapOverlay && selectedData) {
        setShowMapOverlay(true);
      }

      const htmlAddresses = [];

      if (item.roadAddress) {
        htmlAddresses.push(`[도로명 주소] ${item.roadAddress}`);
      }

      if (item.jibunAddress) {
        htmlAddresses.push(`[지번 주소] ${item.jibunAddress}`);
      }

      // JSX 컴포넌트를 HTML 문자열로 변환
      const htmlContent = renderToString(<InfoWindowContent />);

      infowindowRef.current?.setContent(htmlContent);
      infowindowRef.current?.open(mapRef.current!, point);
    });
  };

  // 지도 클릭 시 해당 위치 좌표로 변환
  const searchCoordinateToAddress = (latlng: naver.maps.LatLng) => {
    if (!checkNaverMapsLoaded()) {
      console.error('네이버 지도 API가 로드되지 않았습니다.');
      return;
    }

    naver.maps.Service.reverseGeocode(
      {
        coords: latlng,
        orders: [
          naver.maps.Service.OrderType.ADDR, // 행정동
          naver.maps.Service.OrderType.ROAD_ADDR, // 지번 주소
        ].join(','),
      },
      (
        status: naver.maps.Service.Status,
        response: naver.maps.Service.ReverseGeocodeResponse,
      ) => {
        if (status === naver.maps.Service.Status.ERROR) {
          alert('좌표를 찾을 수 없습니다.');
          return;
        }

        const items = response.v2.results;
        if (!items.length) return;

        const htmlAddresses: string[] = [];

        items.forEach((item) => {
          const addrType =
            item.name === 'roadaddr' ? '[도로명 주소]' : '[지번 주소]';
          const address =
            item.region.area1.name +
            ' ' +
            item.region.area2.name +
            ' ' +
            item.region.area3.name +
            ' ' +
            item.region.area4.name +
            ' ' +
            (item.land.number1 ? ' ' + item.land.number1 : '') +
            (item.land.number2 ? '-' + item.land.number2 : '') +
            (item.land.addition0?.value ? ' ' + item.land.addition0.value : '');

          htmlAddresses.push(`${addrType} ${address}`);
        });

        // JSX 컴포넌트를 HTML 문자열로 변환
        const htmlContent = renderToString(<InfoWindowContent />);
        infowindowRef.current?.setContent(htmlContent);
        infowindowRef.current?.open(mapRef.current!, latlng);
      },
    );
  };

  // 좌표 찾기 버튼 클릭 핸들러
  const handleCoordinateSearch = (data: TableData) => {
    setSearchAddress(data.address);
    setSelectedData(data);
    searchAddressToCoordinate();
  };

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&submodules=geocoder`}
        onLoad={() => {
          // 네이버 지도 API가 완전히 로드된 후 지도 초기화
          setTimeout(() => {
            if (checkNaverMapsLoaded()) {
              initializeMap();
            } else {
              console.error('네이버 지도 API 로드에 실패했습니다.');
            }
          }, 100);
        }}
      />
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      searchAddressToCoordinate();
                    }
                  }}
                />
                <button
                  className={styles.searchBtn}
                  onClick={searchAddressToCoordinate}
                >
                  좌표 검색
                </button>
              </div>
            </div>
            {/* 지도 영역 */}
            <div id="map" className={styles.mapContainer} />
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
      </div>
    </>
  );
}
