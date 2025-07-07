'use client';

import Link from 'next/link';

export default function HomePage() {
    return (
        <main style={{padding: '40px', fontFamily: 'sans-serif'}}>
            <h1 style={{fontSize: '24px', marginBottom: '24px'}}>📌 바로가기</h1>
            <ul style={{listStyle: 'none', padding: 0, lineHeight: '2.4'}}>
                <li>
                    <Link href="/login" style={{color: '#0070f3', textDecoration: 'none'}}>
                        👉 로그인 페이지
                    </Link>
                </li>
                <li>
                    <Link href="/pub" style={{color: '#0070f3', textDecoration: 'none'}}>
                        👉 퍼블 리스트 페이지
                    </Link>
                </li>
            </ul>
        </main>
    );
}
