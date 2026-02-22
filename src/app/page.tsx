import Link from 'next/link';

const links = [
  { href: '/admin', label: '관리자' },
  { href: '/analytics', label: '구글 애널리틱스' },
  { href: '/pub', label: '퍼블 리스트' },
];

export default function HomePage() {
  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>📌 바로가기</h1>
      <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2.4' }}>
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              style={{ color: '#0070f3', textDecoration: 'none' }}
            >
              {`👉 ${label} 페이지`}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
