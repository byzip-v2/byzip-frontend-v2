/**
 * 날짜 포맷 함스
 * @param date - Date 객체 또는 날짜 문자열
 * @param format - 포맷 형식 (현재는 'M월 d일' 고정형식만 지원)
 * @returns 포맷된 날짜 문자열
 */
export const formatDateString = (date: string | Date | undefined): string => {
    if (!date) return '정보가 없습니다.';

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '데이터 오류';

    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();

    return `${month}월 ${day}일`;
};

/**
 * 날짜 범위를 포맷팅 (예: 3월 30일 ~ 4월 3일)
 */
export const formatDateRange = (
    start: string | Date | undefined,
    end: string | Date | undefined,
): string => {
    if (!start || !end) return '정보가 없습니다.';

    const startStr = formatDateString(start);
    const endStr = formatDateString(end);

    return `${startStr} ~ ${endStr}`;
};

/**
 * 오늘 날짜를 기준으로 상태 구분
 */
export const determineHousingType = (
    rceptBgnde: string | Date | undefined,
    rceptEndde: string | Date | undefined,
): 'today' | 'coming' | 'all' => {
    if (!rceptBgnde || !rceptEndde) return 'all';

    const now = new Date();
    const start = new Date(rceptBgnde);
    const end = new Date(rceptEndde);

    // 시간 정보를 초기화하여 날짜만 비교 (선택 사항)
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (now >= start && now <= end) return 'today';
    if (now < start) return 'coming';
    return 'all';
};
