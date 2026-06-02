'use client';

import styles from '@/styles/pages/admin/geo/geo.module.scss';
import Script from 'next/script';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateHousingSupplyCoords } from '../actions';
import { useToast } from '@/app/libs/hooks/useToast';
import Spinner from '@/app/components/common/Spinner/Spinner';
import PrimaryButton from '@/app/components/common/Button/PrimaryButton';
import { RotateCcw } from 'lucide-react';
import AdminPageHeader from '@/app/pub/admin/AdminPageHeader';
import { HousingSupplyResponseDto } from 'byzip-v2-sdk';

interface GeoClientProps {
  initialData: HousingSupplyResponseDto[];
}

export default function GeoPage({ initialData }: GeoClientProps) {
  const router = useRouter();
  const mapRef = useRef<naver.maps.Map | null>(null);
  const infowindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const markerRef = useRef<naver.maps.Marker | null>(null);
  const selectedDataRef = useRef<HousingSupplyResponseDto | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [searchAddress, setSearchAddress] = useState<string>('');
  const [tableData, setTableData] =
    useState<HousingSupplyResponseDto[]>(initialData);
  const { showToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setTableData(initialData);
  }, [initialData]);

  const checkNaverMapsLoaded = () => {
    return (
      typeof window !== 'undefined' &&
      typeof window.naver !== 'undefined' &&
      window.naver.maps
    );
  };

  const createInfoWindowContent = ({
    title,
    roadAddress,
    jibunAddress,
    coords,
  }: {
    title?: string;
    roadAddress?: string;
    jibunAddress?: string;
    coords: { lat: number; lng: number } | null;
  }) => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="${styles.mapOverlay}">
        <div class="${styles.overlayContent}">
          ${title ? `<h3 class="${styles.overlayTitle}">[모집공고명] ${title}</h3>` : ''}
          <p class="${styles.overlayAddress}">도로명 주소: ${roadAddress || '찾을 수 없습니다'}</p>
          ${jibunAddress ? `<p class="${styles.overlayAddress}">지번 주소: ${jibunAddress}</p>` : ''}
          <p class="${styles.overlayCoordinates}">위도: ${coords?.lat.toFixed(7) || '없음'} / 경도: ${coords?.lng.toFixed(7) || '없음'}</p>
          <button class="${styles.addCoordinateBtn}" id="add-coord-btn">공고에 현재 좌표 추가하기</button>
        </div>
      </div>
    `;
    const btn = container.querySelector('#add-coord-btn');
    if (btn && coords) {
      // 기본은 지번 주소, 지번 주소가 없는 경우 도로명 주소 사용
      const address = jibunAddress || roadAddress;
      btn.addEventListener('click', () =>
        handleCoordUpdate(coords?.lat, coords?.lng, address),
      );
    }
    return container;
  };

  const initializeMap = () => {
    if (!checkNaverMapsLoaded()) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) {
      setTimeout(initializeMap, 100);
      return;
    }

    // 지도 초기 중심 좌표
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
    if (!address.trim() || !checkNaverMapsLoaded() || isSearching) return;
    setIsSearching(true);

    try {
      naver.maps.Service.geocode({ query: address }, (status, response) => {
        try {
          if (
            status === naver.maps.Service.Status.ERROR ||
            !response?.v2 ||
            response.v2.meta.totalCount === 0
          ) {
            showToast('주소를 찾을 수 없습니다.', 'error');
            return;
          }

          const item = response.v2.addresses[0];
          const point = new naver.maps.LatLng(
            parseFloat(item.y),
            parseFloat(item.x),
          );
          mapRef.current?.setCenter(point);
          setMarkerPosition(point);

          // JSX 컴포넌트를 HTML 문자열로 변환
          infowindowRef.current?.setContent(
            createInfoWindowContent({
              title: selectedDataRef.current?.houseName,
              roadAddress: item.roadAddress,
              jibunAddress: item.jibunAddress,
              coords: { lat: parseFloat(item.y), lng: parseFloat(item.x) },
            }),
          );
          infowindowRef.current?.open(mapRef.current!, point);
        } finally {
          setIsSearching(false);
        }
      });
    } catch (error) {
      console.error(error);
      showToast('주소 검색 중 오류가 발생했습니다.', 'error');
      setIsSearching(false);
    }
  };

  // 지도 클릭 시 해당 위치 좌표로 변환
  const searchCoordinateToAddress = (latlng: naver.maps.LatLng) => {
    if (!checkNaverMapsLoaded()) return;

    naver.maps.Service.reverseGeocode(
      {
        coords: latlng,
        orders: [
          naver.maps.Service.OrderType.ADDR, // 행정동
          naver.maps.Service.OrderType.ROAD_ADDR, // 지번 주소
        ].join(','),
      },
      (status, response) => {
        if (
          status === naver.maps.Service.Status.ERROR ||
          !response.v2.results.length
        ) {
          showToast('좌표를 찾을 수 없습니다.', 'error');
          return;
        }

        const items = response.v2.results;
        if (!items.length) return;

        let roadAddress = '';
        let jibunAddress = '';

        items.forEach((item) => {
          const address = `${item.region.area1.name} ${item.region.area2.name} ${item.region.area3.name} ${item.region.area4.name} ${item.land.number1 || ''}${item.land.number2 ? '-' + item.land.number2 : ''} ${item.land.addition0?.value || ''}`;

          // 도로명 주소와 지번 주소 저장
          if (item.name === 'roadaddr') {
            roadAddress = address;
          } else if (item.name === 'addr') {
            jibunAddress = address;
          }
        });

        setMarkerPosition(latlng);

        // JSX 컴포넌트를 HTML 문자열로 변환
        infowindowRef.current?.setContent(
          createInfoWindowContent({
            title: selectedDataRef.current?.houseName,
            roadAddress,
            jibunAddress,
            coords: { lat: latlng.y, lng: latlng.x },
          }),
        );
        infowindowRef.current?.open(mapRef.current!, latlng);
      },
    );
  };

  // 좌표 찾기 버튼 클릭 핸들러
  const handleCoordinateSearch = (data: HousingSupplyResponseDto) => {
    setSearchAddress(data.hssplyAdres || '');
    selectedDataRef.current = data; // ref 업데이트
    searchAddressToCoordinate(data.hssplyAdres || '');
  };

  // 좌표 업데이트 DB 반영 핸들러
  const handleCoordUpdate = async (
    lat: number,
    lng: number,
    address?: string,
  ) => {
    if (!selectedDataRef.current || !lat || !lng || isUpdating) return;
    setIsUpdating(true);
    try {
      const result = await updateHousingSupplyCoords(
        selectedDataRef.current.id,
        {
          latitude: lat,
          longitude: lng,
          hssplyAdres: address,
        },
      );
      if (result.success) {
        showToast('좌표 및 주소가 성공적으로 업데이트되었습니다.');
        infowindowRef.current?.close();
        router.refresh();
      } else {
        showToast(result.message, 'error');
      }
    } catch {
      showToast('좌표 업데이트 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * 지도 입력값과 선택된 공고를 초기화합니다.
   * - 검색 입력창(searchAddress) 비우기
   * - 선택된 공고 ref(selectedDataRef) 해제
   * - 인포윈도우 닫기, 마커·지도 중심을 기본 위치로 복귀
   * isResetting으로 버튼 로딩 상태를 표시합니다.
   */
  const handleReset = () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      // 지도 입력값 초기화: 주소 검색창 비우기
      setSearchAddress('');
      // 선택된 공고 해제 (테이블 행 하이라이트 해제는 다음 리렌더 시 반영)
      selectedDataRef.current = null;
      // 인포윈도우 닫기
      infowindowRef.current?.close();
      // 지도·마커를 초기 중심으로 복귀
      if (checkNaverMapsLoaded() && mapRef.current && markerRef.current) {
        const initialCenter = new naver.maps.LatLng(37.3595316, 127.1052133);
        mapRef.current.setCenter(initialCenter);
        markerRef.current.setPosition(initialCenter);
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&submodules=geocoder`}
        // onReady는 스크립트 로드 완료 시점과 컴포넌트 마운트 시점에 모두 실행됨
        onReady={() => {
          initializeMap();
        }}
      />
      <div className={styles.geoPage}>
        <AdminPageHeader title="좌표 관리" />
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
                <PrimaryButton
                  onClick={() => searchAddressToCoordinate(searchAddress)}
                  isLoading={isSearching}
                >
                  좌표 검색
                </PrimaryButton>
              </div>
            </div>

            {/* 지도 영역 */}
            <div id="map" className={styles.mapContainer} />
          </div>
          {/* 데이터 테이블 영역 */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>
                좌표가 없는 공고 (<span>{tableData.length}</span>개)
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
                    <RotateCcw size={15} /> 초기화
                  </>
                )}
              </button>
            </div>
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
                      <td>
                        <div className={styles.cellEllipsis}>
                          {data.houseName || '-'}
                        </div>
                      </td>
                      <td>
                        <div className={styles.cellEllipsis}>
                          {data.hssplyAdres || '-'}
                        </div>
                      </td>
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
