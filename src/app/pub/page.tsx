import Link from 'next/link';
import styles from '@/styles/pages/pubList.module.scss';

const pubPages = [
    {name: 'Login', path: '/pub/login'},
    // { name: 'Signup', path: '/pub/signup' },
    // { name: 'Dashboard', path: '/pub/dashboard' },
];

export default function PubListPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>📄 퍼블리싱 리스트</h1>
            <table className={styles.table}>
                <thead>
                <tr>
                    <th>#</th>
                    <th>페이지 이름</th>
                    <th>링크</th>
                </tr>
                </thead>
                <tbody>
                {pubPages.map((page, i) => (
                    <tr key={page.path}>
                        <td>{i + 1}</td>
                        <td>{page.name}</td>
                        <td>
                            <Link href={page.path} className={styles.link}>
                                {page.path}
                            </Link>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
