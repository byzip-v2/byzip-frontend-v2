import axios from 'axios';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    lawdCd: string;
    contractMonth: string;
  }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { lawdCd, contractMonth } = await params;
  const serviceKey = process.env.NEXT_PUBLIC_APT_API_KEY;

  if (!serviceKey) {
    return NextResponse.json(
      {
        success: false,
        message: '실거래가 API 키가 설정되지 않았습니다.',
        items: [],
      },
      { status: 500 },
    );
  }

  try {
    const response = await axios.get(
      'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade',
      {
        params: {
          serviceKey,
          numOfRows: 200,
          LAWD_CD: lawdCd,
          DEAL_YMD: contractMonth,
          _type: 'json',
        },
        timeout: 10000,
      },
    );

    const rawItems = response.data?.response?.body?.items?.item ?? [];
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    return NextResponse.json({
      success: true,
      message: '실거래가 데이터를 조회했습니다.',
      lawdCd,
      contractMonth,
      items,
    });
  } catch (error) {
    const message =
      axios.isAxiosError(error) && error.response?.data
        ? JSON.stringify(error.response.data)
        : error instanceof Error
          ? error.message
          : '실거래가 데이터를 불러오지 못했습니다.';

    return NextResponse.json(
      {
        success: false,
        message,
        lawdCd,
        contractMonth,
        items: [],
      },
      { status: 500 },
    );
  }
}
