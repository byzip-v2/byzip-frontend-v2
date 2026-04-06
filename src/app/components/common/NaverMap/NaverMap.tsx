'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';

interface NaverMapProps {
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const NaverMap = ({
  className,
  center = { lat: 37.5665, lng: 126.978 }, // 기본 서울 중심
  zoom = 13,
}: NaverMapProps) => {
  const mapRef = useRef<naver.maps.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initMap = React.useCallback(() => {
    if (typeof window === 'undefined' || !window.naver || !containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = new naver.maps.Map(containerRef.current, {
        center: new naver.maps.LatLng(center.lat, center.lng),
        zoom: zoom,
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.TOP_RIGHT,
        },
      });
    }
  }, [center.lat, center.lng, zoom]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.naver && window.naver.maps) {
      initMap();
    }
  }, [initMap]);

  return (
    <>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&submodules=geocoder`}
        strategy="afterInteractive"
        onReady={initMap}
      />
      <div 
        ref={containerRef} 
        className={className} 
        style={{ width: '100%', height: '100%' }}
      />
    </>
  );
};

export default NaverMap;
