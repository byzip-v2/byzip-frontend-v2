import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';

export interface LoginFormProps {
  /**
   * 로그인 성공 핸들러
   */
  onLogin?: (email: string, password: string) => void;
  /**
   * 로딩 상태
   */
  loading?: boolean;
  /**
   * 에러 메시지
   */
  errorMessage?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  loading = false,
  errorMessage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 간단한 검증
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = '이메일을 입력해주세요';
    }
    
    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onLogin?.(email, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2 className="login-title">환영합니다 👋</h2>
      
      <Input
        type="email"
        icon="email"
        label="이메일"
        placeholder="이메일을 입력하세요"
        value={email}
        onChange={setEmail}
        error={!!errors.email}
        errorMessage={errors.email}
      />
      
      <Input
        type="password"
        icon="lock"
        label="비밀번호"
        placeholder="비밀번호를 입력하세요"
        value={password}
        onChange={setPassword}
        showPasswordToggle={true}
        error={!!errors.password}
        errorMessage={errors.password}
      />
      
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      <Button
        type="submit"
        variant="primary"
        size="large"
        disabled={loading}
        loading={loading}
      >
        {loading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}; 