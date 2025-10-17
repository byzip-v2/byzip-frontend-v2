import { requireAuth } from '@/app/libs/utils/auth';
import LogoutButton from './components/LogoutButton';

export default async function AdminPage() {
  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  await requireAuth('/login');

  return (
    <div>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <h1 style={{ marginLeft: '1rem', marginRight: '1rem' }}>Admin Page</h1>
        <LogoutButton />
      </header>
    </div>
  );
}
