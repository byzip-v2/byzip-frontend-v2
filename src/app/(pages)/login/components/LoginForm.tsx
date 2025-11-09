'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, LucideMail } from 'lucide-react';
import AlertModal from '@/app/libs/global-components/AlertModal';
import { loginAction } from '../actions';
import styles from '@/styles/pages/login/login.module.scss';

export default function LoginForm() {
  // UI 상태 관리
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [pwFocused, setPwFocused] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [rememberUserId, setRememberUserId] = useState<boolean>(false);

  // 로딩 상태 관리 (Server Action 호출 중)
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // 패스워드 입력 활성화 조건
  const isPwEnabled = userId.trim().length > 0;

  /**
   * 로그인 처리 함수
   */
  const handleLogin = async () => {
    if (isPending) return;

    if (!userId.trim()) {
      setErrorMessage('아이디를 입력해주세요.');
      setShowModal(true);
      return;
    }

    if (!password.trim()) {
      setErrorMessage('비밀번호를 입력해주세요.');
      setShowModal(true);
      return;
    }

    startTransition(async () => {
      try {
        const result = await loginAction(userId, password);

        if (result.success) {
          if (rememberUserId) {
            localStorage.setItem('savedUserId', userId);
          } else {
            localStorage.removeItem('savedUserId');
          }

          router.push('/admin');
        } else {
          setErrorMessage(result.message || '로그인에 실패했습니다.');
          setShowModal(true);
        }
      } catch (error) {
        console.error('로그인 처리 중 에러:', error);
        setErrorMessage('로그인 처리 중 오류가 발생했습니다.');
        setShowModal(true);
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  useEffect(() => {
    const savedUserId = localStorage.getItem('savedUserId');
    if (savedUserId) {
      setUserId(savedUserId);
      setRememberUserId(true);
    }
  }, []);

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>환영합니다 👋</h2>

      <div className={styles.inputGroup}>
        <label>아이디</label>
        <div className={`${styles.inputWithIcon} `}>
          <LucideMail size={16} />
          <input
            type="text"
            placeholder="아이디를 입력해 주세요."
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={isPending}
            autoComplete="username"
          />
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label>비밀번호</label>
        <div
          className={`${styles.inputWithIcon} ${!isPwEnabled ? styles.fakeDisabled : ''} ${pwFocused ? styles.focused : ''}`}
        >
          <Lock size={16} />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호를 입력해 주세요."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPwFocused(true)}
            onBlur={() => setPwFocused(false)}
            onKeyPress={handleKeyPress}
            disabled={isPending || !isPwEnabled}
            autoComplete="current-password"
          />
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isPending}
          >
            {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>

      <div className={styles.optionRow}>
        <label>
          <input
            type="checkbox"
            checked={rememberUserId}
            onChange={(e) => setRememberUserId(e.target.checked)}
            disabled={isPending}
          />
          아이디 저장
        </label>
      </div>

      <button className={styles.signInBtn} onClick={handleLogin}>
        {isPending ? '로그인 중...' : '로그인'}
      </button>

      {showModal && (
        <AlertModal
          message={errorMessage}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
