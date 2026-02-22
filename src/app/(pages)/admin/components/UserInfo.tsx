import React from 'react';
import styles from '@/styles/pages/admin/admin-layout.module.scss';
import { GetMeDataDto } from 'byzip-v2-sdk';
import LogoutButton from './LogoutButton';

interface UserInfoProps {
  userInfo: GetMeDataDto | null;
}

export default function UserInfo({ userInfo }: UserInfoProps) {
  return (
    <div className={styles.userInfo}>
      <div className={styles.userDetails}>
        <div className={styles.userName}>{userInfo?.name || '사용자'}</div>
        <div className={styles.userEmail}>
          {userInfo?.email || '이메일 없음'}
        </div>
      </div>
      <LogoutButton />
    </div>
  );
}
