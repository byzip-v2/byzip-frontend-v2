'use client';

import { useState } from 'react';
import { getUserInfo } from '../actions';
import type { GetMeDataDto } from 'byzip-v2-sdk';

/**
 * /user/me API 호출 테스트 버튼 컴포넌트
 */
export default function UserMeTestButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [userData, setUserData] = useState<GetMeDataDto | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setMessage(null);
    setUserData(null);

    try {
      const result = await getUserInfo();
      console.error('🔍 [UserMeTestButton] 결과:', result);

      // result가 undefined인 경우 처리
      if (!result) {
        setMessage('❌ 서버 응답이 없습니다.');
        return;
      }

      if (result.success && result.data) {
        setMessage('✅ 사용자 정보 조회 성공');
        setUserData(result.data);
      } else {
        setMessage(`❌ ${result.message || '사용자 정보 조회 실패'}`);
      }
    } catch (error) {
      console.error('🔍 [UserMeTestButton] 에러:', error);
      setMessage(
        `❌ 에러 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          padding: '8px 16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          marginRight: '8px',
        }}
      >
        {loading ? '호출 중...' : '/user/me API 호출'}
      </button>
      {message && (
        <span
          style={{
            fontSize: '14px',
            color: message.includes('성공') ? '#10b981' : '#ef4444',
            marginLeft: '8px',
          }}
        >
          {message}
        </span>
      )}
      {userData && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
            사용자 정보:
          </div>
          <div>ID: {userData.userId}</div>
          <div>이름: {userData.name}</div>
          <div>이메일: {userData.email}</div>
          {userData.phoneNumber && <div>전화번호: {userData.phoneNumber}</div>}
        </div>
      )}
    </div>
  );
}
