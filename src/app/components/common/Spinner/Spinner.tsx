import styles from '@/styles/components/spinner.module.scss';

interface SpinnerProps {
  /** 스피너의 가로/세로 크기 (픽셀 단위, 기본값: 16) */
  size?: number;
  /** 스피너 선의 두께 (픽셀 단위, 기본값: 2) */
  strokeWidth?: number;
  /** 컴포넌트 외부에 추가 스타일이나 레이아웃 지정을 위한 className */
  className?: string;
}

export default function Spinner({ size = 16, strokeWidth = 2, className = '' }: SpinnerProps) {
  return (
    <span
      className={`${styles.spinner} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderWidth: `${strokeWidth}px`,
      }}
      aria-label="loading"
    />
  );
}

