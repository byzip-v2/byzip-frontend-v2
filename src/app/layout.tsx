import localFont from 'next/font/local';
import type { Metadata } from 'next';
import '../styles/legacy-fonts.css';
// Tailwind를 먼저 로드해 레이어가 정의된 뒤, main.scss의 base 레이어가 합쳐지도록 함
import '../styles/tailwind.css';
import '../styles/main.scss';

// Pretendard 폰트 로드
const pretendard = localFont({
  src: [
    {
      path: '../fonts/Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Pretendard-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/Pretendard-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    { path: '../fonts/Pretendard-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-pretendard', // SCSS에서 쓸 CSS 변수명
  display: 'swap',
});

// PyeongChang 폰트 로드
const pyeongchang = localFont({
  src: [
    {
      path: '../fonts/PyeongChang-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    { path: '../fonts/PyeongChang-Bold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-pyeongchang',
  display: 'swap',
});

// 글로벌 검색엔진 최적화(SEO)를 위한 기본 메타데이터 설정
// 하위 페이지에서 별도로 title을 정의할 경우 template에 맞추어 자동으로 타이틀이 매핑됩니다.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://by-zip.com'),
  title: {
    default: '분양모음집',
    template: '%s | 분양모음집',
  },
  description: '내 집 마련을 위한 솔루션, 전국 분양 정보를 한눈에 확인할 수 있는 플랫폼입니다. 국토교통부 아파트 실거래가와 시세 정보를 확인할 수 있습니다. 청약캘린더를 통해 분양 일정을 관리해보세요.',
  openGraph: {
    title: '분양모음집',
    description: '내 집 마련을 위한 솔루션, 전국 분양 정보를 한눈에 확인할 수 있는 플랫폼입니다.',
    images: [
      {
        url: '/og_image.png',
        width: 1200,
        height: 630,
        alt: '분양모음집',
      },
    ],
  },
};

import ToastRenderer from './libs/global-components/ToastRenderer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body className={`${pretendard.variable} ${pyeongchang.variable}`}>
        {children}
        <ToastRenderer />
      </body>
    </html>
  );
}
