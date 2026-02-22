'use client';

import Toast from '@/app/components/common/Toast/Toast';
import { useToast } from '../hooks/useToast';

export default function ToastRenderer() {
  const { toast } = useToast();

  if (!toast) return null;

  return <Toast key={toast.id} message={toast.msg} color={toast.color} />;
}
