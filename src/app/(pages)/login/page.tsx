'use client';

import styles from '@/styles/pages/login/login.module.scss';
import { Eye, EyeOff, Lock, LucideMail } from 'lucide-react';
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AlertModal from '@/app/libs/global-components/AlertModal';
import { loginAction } from './actions';
import Image from 'next/image';

export default function LoginPage() {
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
   * Server Action을 호출하여 로그인을 수행합니다.
   *
   * @description
   * 1. 입력값 유효성 검사
   * 2. Server Action 호출 (서버에서 API 요청 처리)
   * 3. 성공 시: 아이디 저장 옵션 처리 후 메인 페이지로 이동
   * 4. 실패 시: 에러 메시지 모달 표시
   */
  const handleLogin = async () => {
    // 이중 제출 방지
    if (isPending) return;

    // 입력값 검증
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

    // Server Action 호출 (서버에서 안전하게 처리)
    startTransition(async () => {
      try {
        const result = await loginAction(userId, password);

        // 로그인 성공
        if (result.success) {
          // 아이디 저장 옵션 체크 시
          if (rememberUserId) {
            localStorage.setItem('savedUserId', userId);
          } else {
            localStorage.removeItem('savedUserId');
          }

          // 메인 페이지로 이동
          router.push('/admin');
        } else {
          // 로그인 실패 - 에러 메시지 표시
          setErrorMessage(result.message || '로그인에 실패했습니다.');
          setShowModal(true);
        }
      } catch (error) {
        // 예상치 못한 에러 처리
        console.error('로그인 처리 중 에러:', error);
        setErrorMessage('로그인 처리 중 오류가 발생했습니다.');
        setShowModal(true);
      }
    });
  };

  /**
   * Enter 키 입력 처리
   * 비밀번호 입력란에서 Enter 키를 누르면 로그인 시도
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  /**
   * 컴포넌트 마운트 시 저장된 아이디 불러오기
   */
  useEffect(() => {
    const savedUserId = localStorage.getItem('savedUserId');
    if (savedUserId) {
      setUserId(savedUserId);
    }
  }, []);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <Image
          src="/images/byzip_logo.png"
          alt="분양모음집 로고"
          width={30}
          height={45}
          loading="eager"
          priority
        />
        <span>분양모음집-관리자</span>
      </header>

      {/*로그인 카드 */}
      <div className={styles.card}>
        <h2 className={styles.title}>환영합니다 👋</h2>

        <div className={styles.inputGroup}>
          <label>ID</label>
          <div className={`${styles.inputWithIcon} `}>
            <LucideMail size={16} />
            <input
              type="text"
              placeholder="아이디를 입력하세요"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={isPending}
              autoComplete="username"
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label>Password</label>
          <div
            className={`${styles.inputWithIcon} ${!isPwEnabled ? styles.fakeDisabled : ''} ${pwFocused ? styles.focused : ''}`}
          >
            <Lock size={16} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요"
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
          {isPending ? '로그인 중...' : 'Sign in'}
        </button>

        {/* 에러 메시지 모달 */}
        {showModal && (
          <AlertModal
            message={errorMessage}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </div>
  );
}
