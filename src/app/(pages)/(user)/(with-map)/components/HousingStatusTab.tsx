'use client';

import React from 'react';
import Image from 'next/image';

interface HousingStatusTabProps {
  activeTab: number;
  onTabChange: (id: number) => void;
  counts: {
    all: number;
    today: number;
    coming: number;
    random: number;
  };
}

const HousingStatusTab = ({
  activeTab,
  onTabChange,
  counts,
}: HousingStatusTabProps) => {
  const tabs = [
    {
      id: 0,
      label: '전체',
      count: counts.all,
      icon: '/images/icons/all.png',
      bd: '#356EFF',
      bs: 'rgba(145, 176, 255, 0.5)',
    },
    {
      id: 1,
      label: '청약 가능',
      count: counts.today,
      icon: '/images/icons/today.png',
      bd: '#3EDE87',
      bs: 'rgba(62, 222, 135, 0.5)',
    },
    {
      id: 2,
      label: '청약 예정',
      count: counts.coming,
      icon: '/images/icons/coming.png',
      bd: '#FF4141',
      bs: 'rgba(255, 166, 166, 0.5)',
    },
    {
      id: 3,
      label: '무순위',
      count: counts.random,
      icon: '/images/icons/random.png',
      bd: '#CB5EFF',
      bs: 'rgba(232, 184, 255, 0.5)',
    },
  ];

  return (
    <div className="w-full flex justify-center items-center pt-4 pb-2">
      {/* 
        (한국어) 550px 이하(모바일 화면)에서는 전체 탭 바 너비를 400px로 제한(max-w-[400px])하고 중앙 정렬(mx-auto) 및 좁은 여백(gap-2)을 설정합니다.
        다만 432px 이하(미만)의 초소형 모바일 기기 환경에서는 마진과 패딩의 중첩으로 인해 카드가 과도하게 안으로 들어가는 레이아웃 오정렬을 방지하기 위해 마진을 제거(mx-0)하고 너비를 꽉 채우도록(max-w-full) 조정합니다.
        화면 크기가 432px 미만으로 작아졌을 때는 화면 좌우에 딱 붙어 답답해 보이지 않도록 좌우 여백(px-4)을 적용하고, 432px 이상 550px 이하에서는 여백 없이 꽉 채웁니다(min-[432px]:px-0).
        550px 초과(데스크톱 화면)에서는 원래 크기(min-[551px]:max-w-3xl, px-4, gap-3)로 복원합니다.
      */}
      <ul className="flex items-center px-4 min-[432px]:px-0 min-[551px]:px-4 gap-2 min-[551px]:gap-3 w-full max-w-full min-[432px]:max-w-[400px] min-[551px]:max-w-3xl mx-0 min-[432px]:mx-auto list-none py-1.5 pb-3 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <li
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex flex-col justify-start items-start p-1.5 min-[551px]:p-2 gap-2 min-[551px]:gap-3.5
              min-w-0 flex-1 min-[551px]:min-w-28 min-[551px]:flex-initial h-16 min-[551px]:h-[76px] bg-white border-[1.5px] rounded-xl cursor-pointer 
              transition-all duration-500 ease-in-out tab-item
              ${activeTab === tab.id ? 'focused' : 'border-[#d8d8d8]'}
            `}
            style={
              {
                '--tab-bd': tab.bd,
                '--tab-bs': tab.bs,
                ...(activeTab === tab.id
                  ? {
                    borderColor: tab.bd,
                    boxShadow: `2px 4px 4px ${tab.bs}`,
                  }
                  : {}),
              } as React.CSSProperties
            }
          >
            <div className="flex items-center gap-1.5 w-full text-[#8e8e8e] leading-[140%] mb-1">
              <div className="w-5 h-4 min-[551px]:w-7 min-[551px]:h-6 flex items-center justify-center relative shrink-0">
                {/* (한국어) Next.js 14-15에서 고정 width/height 사용 시 CSS 높이 조절로 인한 종횡비 경고를 해결하기 위해 'fill' 속성을 적용합니다. */}
                {/* 부모 요소가 relative 포지션과 w-7 h-6 크기를 가지므로, fill과 object-contain의 조합이 권장되는 모범 사례입니다. */}
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  fill
                  // (한국어) fill 속성을 사용할 때 Next.js가 기본으로 100vw용 이미지를 생성하여 성능 낭비와 경고를 방지하도록, 실제 렌더링될 최대 너비(28px)를 sizes 속성으로 정의합니다.
                  sizes="28px"
                  priority={true}
                  className="object-contain"
                />
              </div>
              <div className="pt-0.5 text-xs min-[551px]:text-sm font-semibold truncate">{tab.label}</div>
            </div>
            <div className="text-xl font-bold text-black leading-[80%] h-4 -mt-1 pl-1">
              {tab.count}
            </div>
          </li>
        ))}
      </ul>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .tab-item:hover {
          border-color: var(--tab-bd);
          box-shadow: 2px 4px 4px var(--tab-bs);
        }
      `}</style>
    </div>
  );
};

export default HousingStatusTab;
