'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Spinner from '@/app/components/common/Spinner/Spinner';
import styles from '@/styles/components/button.module.scss';

type PrimaryButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  children: ReactNode;
  isLoading?: boolean;
};

export default function PrimaryButton({
  children,
  className,
  disabled,
  isLoading = false,
  type = 'button',
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={[styles.button, styles.primary, className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
}
