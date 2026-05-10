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

export const metadata: Metadata = {
  title: '분양모음집 V2',
  description: 'new 분양모음집',
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
