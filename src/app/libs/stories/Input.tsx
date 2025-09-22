import React, { useState } from 'react';
import { Eye, EyeOff, Lock, LucideMail } from 'lucide-react';
import './input.css';

export interface InputProps {
  /**
   * 입력 필드 타입
   */
  type?: 'text' | 'email' | 'password';
  /**
   * 플레이스홀더
   */
  placeholder?: string;
  /**
   * 라벨 텍스트
   */
  label?: string;
  /**
   * 아이콘 타입
   */
  icon?: 'email' | 'lock' | 'none';
  /**
   * 비밀번호 표시/숨김 기능
   */
  showPasswordToggle?: boolean;
  /**
   * 에러 상태
   */
  error?: boolean;
  /**
   * 에러 메시지
   */
  errorMessage?: string;
  /**
   * 비활성화 상태
   */
  disabled?: boolean;
  /**
   * 값
   */
  value?: string;
  /**
   * 변경 핸들러
   */
  onChange?: (value: string) => void;
  /**
   * 포커스 핸들러
   */
  onFocus?: () => void;
  /**
   * 블러 핸들러
   */
  onBlur?: () => void;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  label,
  icon = 'none',
  showPasswordToggle = false,
  error = false,
  errorMessage,
  disabled = false,
  value = '',
  onChange,
  onFocus,
  onBlur,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const renderIcon = () => {
    switch (icon) {
      case 'email':
        return <LucideMail size={16} />;
      case 'lock':
        return <Lock size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="input-group">
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}
      
      <div className={`input-container ${error ? 'error' : ''} ${disabled ? 'disabled' : ''} ${isFocused ? 'focused' : ''}`}>
        {renderIcon()}
        
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className="input-field"
        />
        
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={togglePassword}
            className="password-toggle"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      
      {error && errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
    </div>
  );
}; 