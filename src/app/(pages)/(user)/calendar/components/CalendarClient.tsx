'use client';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import Image from 'next/image';
import React from 'react';
import { RxDotFilled } from 'react-icons/rx';
import { useRouter } from 'next/navigation';
import styles from './calendar.module.scss';
import { HousingSupplyResponseDto } from 'byzip-v2-sdk';

interface CalendarData {
  title: string;
  date: Date;
  id: string;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
}

/** 캘린더 렌더링에 필요한 필드만 추린 주택 공급 정보 타입 */
export type CalendarHousingData = Pick<
  HousingSupplyResponseDto,
  'id' | 'houseName' | 'rceptEndde' | 'houseSecdNm'
>;

const CalendarClient = ({
  initialHousingData,
}: {
  initialHousingData: CalendarHousingData[];
}) => {
  const router = useRouter();
  // 청약캘린더 헤더에서 사용
  const calendarColorList = [
    { cate: 'APT', color: '#25AAC8' },
    { cate: '임의공급', color: '#FF971D' },
    { cate: '신혼희망타운', color: '#FB39FF' },
    { cate: '잔여세대', color: '#2B54A3' },
    { cate: '민간임대', color: '#5C5C5C' },
    { cate: '오피스텔', color: '#C82525' },
  ];
  const getCalendarBgColor = (type: string) => {
    switch (type) {
      case 'APT':
        return '#25AAC8';
      case '민간임대':
        return '#5C5C5C';
      case '신혼희망타운':
        return '#FB39FF';
      case '잔여세대':
        return '#2B54A3';
      case '임의공급':
        return '#FF971D';
      case '오피스텔':
        return '#C82525';
      default:
        return 'black';
    }
  };

  const convertCalendarData = (item: CalendarHousingData) => {
    houseList.push({
      title: item.houseName,
      date: item.rceptEndde,
      id: String(item.id),
      borderColor: 'transparent',
      backgroundColor: getCalendarBgColor(item.houseSecdNm),
      textColor: 'white',
    });
  };

  const housingData = initialHousingData;
  const houseList: CalendarData[] = [];

  housingData.map((item) => {
    return convertCalendarData(item);
  });

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center py-10 max-[730px]:py-7.5 z-2 relative bg-[#f8faff] ">
      <div className="w-[95%] max-w-275">
        <div className="w-full flex justify-between pb-7.5 relative z-2 max-[730px]:px-2.5 max-[730px]:pb-5">
          <div className="flex flex-col">
            <div className="font-bold text-[22px] leading-[140%] pb-3.75 max-[730px]:text-[18px] max-[730px]:pb-2.5 max-[730px]:pl-0.75">
              청약 일정을 확인해 보세요.
            </div>
            <div className="flex max-[730px]:w-full max-[730px]:flex-wrap">
              {calendarColorList.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center font-medium text-[17px] leading-4.25 mr-1.75 max-[730px]:text-[14px] max-[730px]:pb-1.25"
                  style={{ color: item.color }}
                >
                  <RxDotFilled size="20" style={{ marginRight: 2 }} />
                  {item.cate}
                </div>
              ))}
            </div>
          </div>
          <div>
            <Image
              className="hidden sm:block"
              src={'/images/calendar/calendar.png'}
              alt="calendarIcon"
              height={80}
              quality={100}
              priority={true}
              width={80}
            />
          </div>
        </div>
        <div className={styles.calendarWrapper}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev',
              center: 'title',
              right: 'next',
            }}
            initialView="dayGridMonth"
            nowIndicator={true}
            fixedWeekCount={false} // 달에 따라 4-6주를 보여줌 (6주로 고정x)
            weekends={true} // 주말 마감 청약도 표시해야 하므로 토·일 노출
            locale={'ko'} // 한글 표기
            contentHeight="auto" // 스크롤 생성되지 않고 높이 자동 조절
            events={houseList}
            eventClick={(e) => router.push(`/detail/${e.event.id}`)}
          />
        </div>
      </div>
      <div className="w-screen h-46.5 absolute top-0 left-0 bg-linear-to-b from-[#d9e5ff] to-[rgba(216,228,255,0)] z-[1]" />
    </div>
  );
};

export default CalendarClient;
