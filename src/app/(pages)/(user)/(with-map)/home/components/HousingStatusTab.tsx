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
      <ul className="flex items-center px-4 gap-3 w-full max-w-3xl list-none py-1.5 pb-3 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <li
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex flex-col justify-start items-start p-2 gap-3.5
              min-w-28 h-19 bg-white border-[1.5px] rounded-xl cursor-pointer 
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
            <div className="flex items-center gap-1.5 w-full text-xs text-[#8e8e8e] leading-[140%] mb-1">
              <div className="w-7 h-6 flex items-center justify-center relative">
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  width={28}
                  height={22}
                  quality={100}
                  priority={true}
                  className="object-contain"
                />
              </div>
              <div className="pt-0.5 text-sm font-semibold">{tab.label}</div>
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
