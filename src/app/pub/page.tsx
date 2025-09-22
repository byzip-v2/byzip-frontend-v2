import Link from 'next/link';
import styles from '@/styles/pub/pubList.module.scss';

const pubSections = [
    {
        category: '관리자',
        items: [
            {name: '로그인', path: '/pub/login', note: 'v.1.0_250705', status: '완료'},
            {name: '좌표관리', path: '/pub/admin/geo', note: 'v.1.0_', status: '진행중'},
        ],
    },
    {
        category: '서비스',
        items: [
            {name: '캘린더', path: '/pub/calendar', note: 'v.1.0_', status: '진행중'},
        ],
    },
];


export default function PubListPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>📄 퍼블리싱 리스트</h1>
            {pubSections.map((section, sectionIdx) => (
                <div key={section.category}>
                    <h2 className={styles.category}>{section.category}</h2>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>페이지 이름</th>
                            <th>링크</th>
                            <th>상태</th>
                            <th>비고</th>
                        </tr>
                        </thead>
                        <tbody>
                        {section.items.map((page, i) => (
                            <tr key={page.path}>
                                <td>{i + 1}</td>
                                <td>{page.name}</td>
                                <td>
                                    <Link href={page.path} className={styles.link}>
                                        {page.path}
                                    </Link>
                                </td>
                                <td>
                    <span
                        className={`${styles.badge} ${
                            page.status === '완료'
                                ? styles.done
                                : page.status === '진행중'
                                    ? styles.progress
                                    : ''
                        }`}
                    >
                      {page.status}
                    </span>
                                </td>
                                <td>{page.note}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ))}

        </div>
    );
}
