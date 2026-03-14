export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full h-[calc(100vh-60px)] overflow-hidden">
      {/* 콘텐츠 영역 (3/5) */}
      <div className="flex-3 h-full overflow-y-auto bg-white">{children}</div>

      {/* 지도 영역 (2/5) */}
      <div className="hidden md:flex flex-2 h-full bg-gray-100 items-center justify-center border-l border-gray-200">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-500 font-bold">Map</span>
          </div>
          <span className="text-gray-400 font-medium">지도</span>
        </div>
      </div>
    </div>
  );
}
