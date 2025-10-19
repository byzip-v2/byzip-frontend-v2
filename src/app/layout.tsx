import localFont from "next/font/local";
import type {Metadata} from "next";
import "../styles/main.scss";

// Pretendard 폰트 로드
const pretendard = localFont({
  src: [
    { path: "../fonts/Pretendard-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Pretendard-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-pretendard", // SCSS에서 쓸 CSS 변수명
  display: "swap",
});

// PyeongChang 폰트 로드
const pyeongchang = localFont({
  src: [
    { path: "../fonts/PyeongChang-Regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/PyeongChang-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-pyeongchang",
  display: "swap",
});

export const metadata: Metadata = {
    title: "분양모음집 V2",
    description: "new 분양모음집",
};

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
        </body>
        </html>
    );
}
