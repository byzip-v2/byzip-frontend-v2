'use client';

import { useState, useEffect } from 'react';
import { getUserInfo } from '../actions';
import { GetMeResponseDto } from 'byzip-v2-sdk';

export default function UserInfo() {
  const [userInfo, setUserInfo] = useState<GetMeResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoading(true);
        setError('');

        const result = await getUserInfo();

        if (result.success && result.data) {
          setUserInfo(result.data);
        } else {
          setError(result.message);
        }
      } catch (error) {
        console.error('사용자 정보 조회 중 에러:', error);
        setError('사용자 정보를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>사용자 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
        }}
      >
        <p style={{ color: '#c33', margin: 0 }}>❌ {error}</p>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>사용자 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        borderRadius: '8px',
        margin: '20px 0',
      }}
    >
      <h3 style={{ marginTop: 0, color: '#333' }}>👤 내 정보</h3>

      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
          <strong
            style={{ color: '#666', display: 'inline-block', width: '100px' }}
          >
            아이디:
          </strong>
          <span style={{ color: '#333' }}>{userInfo.userId}</span>
        </div>
        <div style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
          <strong
            style={{ color: '#666', display: 'inline-block', width: '100px' }}
          >
            이름:
          </strong>
          <span style={{ color: '#333' }}>{userInfo.name}</span>
        </div>
        <div style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
          <strong
            style={{ color: '#666', display: 'inline-block', width: '100px' }}
          >
            이메일:
          </strong>
          <span style={{ color: '#333' }}>{userInfo.email}</span>
        </div>
        <div style={{ padding: '8px 0' }}>
          <strong
            style={{ color: '#666', display: 'inline-block', width: '100px' }}
          >
            전화번호:
          </strong>
          <span style={{ color: '#333' }}>{userInfo.phoneNumber}</span>
        </div>
      </div>
    </div>
  );
}
