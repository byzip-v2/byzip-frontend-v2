import type {Metadata} from "next";
import "../styles/main.scss";

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
            <link 
                href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" 
                rel="stylesheet" 
            />
        </head>
        <body>
        {children}
        </body>
        </html>
    );
}
