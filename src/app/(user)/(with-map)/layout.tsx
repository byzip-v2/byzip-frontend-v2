import NaverMap from '@/app/components/common/NaverMap/NaverMap';

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden">
      {/* 콘텐츠 영역 (3/5) */}
      <div className="flex-3 h-full overflow-y-auto bg-white">{children}</div>

      {/* 지도 영역 (2/5) */}
      <div className="hidden md:flex flex-2 h-full bg-gray-100 border-l border-gray-200 relative">
        <NaverMap />
      </div>
    </div>
  );
}
