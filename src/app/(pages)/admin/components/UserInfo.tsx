import React from 'react';
import styles from '@/styles/pages/admin/admin-layout.module.scss';
import LogoutButton from './LogoutButton';
import { MemberResponseDto } from 'byzip-v2-sdk';

interface UserInfoProps {
  userInfo: MemberResponseDto | null;
}

export default function UserInfo({ userInfo }: UserInfoProps) {
  return (
    <div className={styles.userInfo}>
      <div className={styles.userDetails}>
        <div className={styles.userName}>{userInfo?.name || '사용자'}</div>
      </div>
      <LogoutButton />
    </div>
  );
}
