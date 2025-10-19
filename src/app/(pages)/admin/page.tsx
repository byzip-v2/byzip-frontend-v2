import { requireAuth } from '@/app/libs/utils/auth';
import LogoutButton from './components/LogoutButton';
import UserInfo from './components/UserInfo';

export default async function AdminPage() {
  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  await requireAuth('/login');

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #eee',
        }}
      >
        <h1 style={{ margin: 0, color: '#333' }}>관리자 페이지</h1>
        <LogoutButton />
      </header>
      <UserInfo />
    </div>
  );
}
