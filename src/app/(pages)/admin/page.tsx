import ErrorTestButton from './components/ErrorTestButton';
import ClientErrorTestButton from './components/ClientErrorTestButton';
import UserMeTestButton from './components/UserMeTestButton';

export default async function AdminPage() {
  return (
    <div style={{ padding: '20px' }}>
      <header>
        <h1>대시보드</h1>
      </header>
      <section style={{ marginTop: '32px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
          API 테스트
        </h2>
        <UserMeTestButton />
      </section>
      <section style={{ marginTop: '32px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
          서버 에러 테스트
        </h2>
        <ErrorTestButton errorType="404" label="404 에러 테스트" />
        <ErrorTestButton errorType="500" label="500 에러 테스트" />
        <ErrorTestButton errorType="network" label="네트워크 에러 테스트" />
        <ErrorTestButton errorType="timeout" label="타임아웃 에러 테스트" />
      </section>
      <section style={{ marginTop: '32px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
          클라이언트 에러 테스트
        </h2>
        <ClientErrorTestButton />
      </section>
    </div>
  );
}
