'use client';

import styles from '@/styles/pages/admin/geo/geo.module.scss';
import { HousingSupplyDataDto } from 'byzip-v2-sdk';
import Script from 'next/script';
import { useRef, useState, useEffect } from 'react';
import { renderToString } from 'react-dom/server';

interface GeoClientProps {
  initialData: HousingSupplyDataDto[];
}

// InfoWindow용 JSX 컴포넌트
const InfoWindowContent = ({
  title,
  roadAddress,
  jibunAddress,
  coords,
}: {
  title: string | undefined;
  roadAddress: string | undefined;
  jibunAddress: string | undefined;
  coords: { lat: number; lng: number } | null;
}) => (
  <div className={styles.mapOverlay}>
    <div className={styles.overlayContent}>
      {title && <h3 className={styles.overlayTitle}>[모집공고명] {title}</h3>}
      <p className={styles.overlayAddress}>
        도로명 주소: {roadAddress || '찾을 수 없습니다'}
      </p>
      {jibunAddress && (
        <p className={styles.overlayAddress}>
          지번 주소: {jibunAddress || '찾을 수 없습니다'}
        </p>
      )}
      <p className={styles.overlayCoordinates}>
        위도: {coords?.lat.toFixed(7) || '찾을 수 없습니다'} / 경도:{' '}
        {coords?.lng.toFixed(7) || '찾을 수 없습니다'}
      </p>
      <button className={styles.addCoordinateBtn}>
        공고에 현재 좌표 추가하기
      </button>
    </div>
  </div>
);

export default function GeoPage({ initialData }: GeoClientProps) {
  const mapRef = useRef<naver.maps.Map | null>(null);
  const infowindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const markerRef = useRef<naver.maps.Marker | null>(null);

  // mapRef 클로저 문제로 인해 선택된 데이터를 ref로 관리
  const selectedDataRef = useRef<HousingSupplyDataDto | null>(null);

  const [searchAddress, setSearchAddress] = useState<string>('');
  const [tableData, setTableData] =
    useState<HousingSupplyDataDto[]>(initialData);

  useEffect(() => {
    setTableData(initialData);
  }, [initialData]);

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

    // 지도 초기 중심 좌표 (부여군 근처)
    const initialCenter = new naver.maps.LatLng(37.3595316, 127.1052133);

    mapRef.current = new naver.maps.Map('map', {
      center: initialCenter,
      zoom: 15,
    });

    // InfoWindow 초기화
    infowindowRef.current = new naver.maps.InfoWindow({
      content: '',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      disableAnchor: true,
      pixelOffset: new naver.maps.Point(0, -40),
    });

    // 마커 초기화
    markerRef.current = new naver.maps.Marker({
      position: initialCenter,
      map: mapRef.current,
    });

    // 지도 클릭 시 마커 표시 및 좌표 표시
    mapRef.current.addListener('click', (e: { coord: naver.maps.LatLng }) => {
      const latlng = e.coord;
      // 클릭한 위치에 마커 표시
      setMarkerPosition(latlng);
      // 역지오코딩으로 주소 가져오기
      searchCoordinateToAddress(latlng);
    });
  };

  /**
   * 마커 위치 업데이트 함수
   */
  const setMarkerPosition = (position: naver.maps.LatLng) => {
    if (!markerRef.current) return;
    markerRef.current.setPosition(position);
  };

  // 주소 검색 시 좌표로 변환
  const searchAddressToCoordinate = (address: string) => {
    if (!address.trim()) return;

    if (!checkNaverMapsLoaded()) {
      console.error('네이버 지도 API가 로드되지 않았습니다.');
      return;
    }

    naver.maps.Service.geocode({ query: address }, (status, response) => {
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

      // 마커 표시
      setMarkerPosition(point);

      // JSX 컴포넌트를 HTML 문자열로 변환 (동적 데이터 전달)
      const htmlContent = renderToString(
        <InfoWindowContent
          title={selectedDataRef.current?.houseName}
          roadAddress={item.roadAddress}
          jibunAddress={item.jibunAddress}
          coords={{ lat: parseFloat(item.y), lng: parseFloat(item.x) }}
        />,
      );

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

        let roadAddress = '';
        let jibunAddress = '';

        items.forEach((item) => {
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

          // 도로명 주소와 지번 주소 저장
          if (item.name === 'roadaddr') {
            roadAddress = address;
          } else if (item.name === 'addr') {
            jibunAddress = address;
          }
        });

        // 마커 표시
        setMarkerPosition(latlng);

        // JSX 컴포넌트를 HTML 문자열로 변환 (동적 데이터 전달)
        const htmlContent = renderToString(
          <InfoWindowContent
            title={selectedDataRef.current?.houseName}
            roadAddress={roadAddress}
            jibunAddress={jibunAddress}
            coords={{ lat: latlng.y, lng: latlng.x }}
          />,
        );
        infowindowRef.current?.setContent(htmlContent);
        infowindowRef.current?.open(mapRef.current!, latlng);
      },
    );
  };

  // 좌표 찾기 버튼 클릭 핸들러
  const handleCoordinateSearch = (data: HousingSupplyDataDto) => {
    setSearchAddress(data.hssplyAdres || '');
    selectedDataRef.current = data; // ref 업데이트
    searchAddressToCoordinate(data.hssplyAdres || '');
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
                      searchAddressToCoordinate(searchAddress);
                    }
                  }}
                />
                <button
                  className={styles.searchBtn}
                  onClick={() => searchAddressToCoordinate(searchAddress)}
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
                  {tableData.map((data) => (
                    <tr
                      key={data.id}
                      className={
                        selectedDataRef.current?.id === data.id
                          ? styles.highlightedRow
                          : ''
                      }
                    >
                      <td>{data.houseName}</td>
                      <td>{data.hssplyAdres}</td>
                      <td>
                        <a
                          href={data.pblancUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.linkBtn}
                        >
                          링크
                        </a>
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
                  {tableData.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{ textAlign: 'center', padding: '40px' }}
                      >
                        좌표가 없는 공고가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
