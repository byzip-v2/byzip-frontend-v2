'use client';

import { useRef, useState } from 'react';
import Script from 'next/script';
import styles from '@/styles/pages/map/Map.module.scss';

// 퍼블 마커 DOM 생성 (전역 CSS .bz-marker 사용)
function createMarkerEl(opts: {
  title: string;
  addr?: string;
  badge?: string;
}) {
  const el = document.createElement('div');
  el.className = 'bz-marker';
  el.innerHTML = `
    <div class="label">
      <span class="title">도로명주소:</span>
      ${opts.addr ? `<span class="addr">${opts.addr}</span>` : ''}
    </div>
  `;
  return el;
}

// 퍼블 말풍선(InfoWindow) content
function createInfoHtml(title: string, lines: string[]) {
  return `
    <div class="bz-infowin" style="min-width:260px;line-height:1.5;">
      <h4 style="margin:0 0 6px 0;">${title}</h4>
      ${lines.map((l) => `<div>${l}</div>`).join('')}
    </div>
  `;
}

export default function MapPage() {
  const mapRef = useRef<naver.maps.Map | null>(null);
  const infoRef = useRef<naver.maps.InfoWindow | null>(null); // infoWindow

  const markerRef = useRef<naver.maps.Marker | null>(null); // ⭐ 커스텀 마커

  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const [ready, setReady] = useState(false); // ✅ SDK/맵 로드 플래그

  // ⭐ 커스텀 마커 올리기/교체
  // upsertMarker: 위치/HTML 갱신
  const upsertMarker = (
    position: naver.maps.LatLng,
    payload: { title: string; addr?: string; badge?: string },
  ) => {
    const el = createMarkerEl(payload); // 네가 만든 HTML 엘리먼트

    // 클릭 이벤트(선택)
    naver.maps.Event.addDOMListener(el, 'click', () => {
      // 상세 패널 오픈 등
    });

    const icon = {
      content: el, // ⭐ HTML 넣기
      anchor: new naver.maps.Point(24, 48), // 핀 하단이 좌표를 가리키게 조정
    };

    if (!markerRef.current) {
      markerRef.current = new naver.maps.Marker({
        map: mapRef.current!,
        position,
        icon,
        zIndex: 10,
      });
    } else {
      markerRef.current.setPosition(position);
      markerRef.current.setIcon(icon as any);
      markerRef.current.setMap(mapRef.current!);
    }
  };

  // 지도 초기화
  const initializeMap = () => {
    const map = new naver.maps.Map('map', {
      center: new naver.maps.LatLng(37.3595316, 127.1052133),
      zoom: 15,
    });

    mapRef.current = map;
    infoRef.current = new naver.maps.InfoWindow({ content: '' });

    // 지도 클릭 시 마커 이동 및 좌표 표시
    map.addListener('click', (e: { coord: naver.maps.LatLng }) => {
      const latlng = e.coord;
      setCoords({ lat: latlng.y, lng: latlng.x });
      searchCoordinateToAddress(latlng);
    });

    setReady(true); // ✅ 준비 완료
  };

  // 주소 검색 시 좌표로 변환
  const searchAddressToCoordinate = () => {
    // if (!address.trim()) return;
    if (!ready || !mapRef.current || !address.trim()) return;

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
      setCoords({ lat: parseFloat(item.y), lng: parseFloat(item.x) });

      const lines: string[] = [];
      if (item.roadAddress) lines.push(`[도로명] ${item.roadAddress}`);
      if (item.jibunAddress) lines.push(`[지번] ${item.jibunAddress}`);

      // ⭐ 말풍선 퍼블 HTML + 커스텀 마커 함께 표시
      // infoRef.current?.setContent(createInfoHtml(`검색 주소 : ${address}`, lines));
      // infoRef.current?.open(mapRef.current!, point);

      upsertMarker(point, {
        title: item.roadAddress ?? address,
        addr: item.jibunAddress ?? '',
      });

      // const htmlAddresses = [];

      // if (item.roadAddress) {
      //   htmlAddresses.push(`[도로명 주소] ${item.roadAddress}`);
      // }

      // if (item.jibunAddress) {
      //   htmlAddresses.push(`[지번 주소] ${item.jibunAddress}`);
      // }

      // // infoWindow 내용 생성
      // const htmlContent = `
      //   <div style="padding:10px;min-width:200px;line-height:150%;">
      //     <h4 style="margin-top:5px;">검색 주소 : ${address}</h4>
      //     ${htmlAddresses.join('<br />')}
      //   </div>
      // `;

      // infoRef.current?.setContent(htmlContent);
      // infoRef.current?.open(mapRef.current!, point);
    });
  };

  // 지도 클릭 시 해당 위치 좌표로 변환
  const searchCoordinateToAddress = (latlng: naver.maps.LatLng) => {
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

        const lines: string[] = [];
        items.forEach((item) => {
          const type = item.name === 'roadaddr' ? '[도로명]' : '[지번]';
          const addr =
            item.region.area1.name +
            ' ' +
            item.region.area2.name +
            ' ' +
            item.region.area3.name +
            ' ' +
            item.region.area4.name +
            (item.land.number1 ? ' ' + item.land.number1 : '') +
            (item.land.number2 ? '-' + item.land.number2 : '') +
            (item.land.addition0?.value ? ' ' + item.land.addition0.value : '');
          lines.push(`${type} ${addr}`);
        });

        // ⭐ 말풍선 퍼블 HTML
        infoRef.current?.setContent(createInfoHtml('검색 좌표', lines));
        infoRef.current?.open(mapRef.current!, latlng);

        // ⭐ 커스텀 마커 업데이트
        upsertMarker(latlng, {
          title: '선택 위치',
          addr: lines[0]?.replace(/^\[(.*?)\]\s*/, ''), // 첫 줄 주소만 라벨에
          badge: '📍',
        });

        // const htmlAddresses: string[] = [];

        // items.forEach((item) => {
        //   const addrType =
        //     item.name === 'roadaddr' ? '[도로명 주소]' : '[지번 주소]';
        //   const address =
        //     item.region.area1.name +
        //     ' ' +
        //     item.region.area2.name +
        //     ' ' +
        //     item.region.area3.name +
        //     ' ' +
        //     item.region.area4.name +
        //     ' ' +
        //     (item.land.number1 ? ' ' + item.land.number1 : '') +
        //     (item.land.number2 ? '-' + item.land.number2 : '') +
        //     (item.land.addition0?.value ? ' ' + item.land.addition0.value : '');

        //   htmlAddresses.push(`${addrType} ${address}`);
        // });

        // // infoWindow 내용 생성
        // infoRef.current?.setContent(`
        //   <div style="padding:10px;min-width:200px;line-height:150%;">
        //     <h4 style="margin-top:5px;">검색 좌표</h4>
        //     ${htmlAddresses.join('<br />')}
        //   </div>
        // `);
        // infoRef.current?.open(mapRef.current!, latlng);
      },
    );
  };

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&submodules=geocoder`}
        onReady={initializeMap}
      />
      <div className={styles.wrapper}>
        <h1 className={styles.title}>주소 → 좌표 변환 서비스</h1>

        <div className={styles.searchBox}>
          <input
            type="text"
            value={address}
            placeholder="주소를 입력하세요"
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                searchAddressToCoordinate();
              }
            }}
          />
          <button onClick={searchAddressToCoordinate}>좌표 검색</button>
        </div>

        {coords && (
          <p className={styles.coords}>
            위도: <strong>{coords.lat}</strong> / 경도:{' '}
            <strong>{coords.lng}</strong>
          </p>
        )}

        <div id="map" className={styles.map} />
      </div>
    </>
  );
}
