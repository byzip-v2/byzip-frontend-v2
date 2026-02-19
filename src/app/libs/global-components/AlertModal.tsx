'use client';

import styles from '@/styles/common/alertModal.module.scss';

interface AlertModalProps {
    /** 모달에 표시할 메시지 */
    message: string;
    /** 닫기 버튼 클릭 시 호출 */
    onClose: () => void;
    /** 설정 시 취소/확인 두 버튼을 표시하는 confirm 모드로 동작 */
    onConfirm?: () => void;
    /** 확인 버튼 텍스트 (기본값: '확인') */
    confirmLabel?: string;
    /** 취소 버튼 텍스트 (기본값: '취소') */
    cancelLabel?: string;
    /** 확인 버튼을 위험(빨간색) 스타일로 표시 */
    danger?: boolean;
}

export default function AlertModal({
    message,
    onClose,
    onConfirm,
    confirmLabel = '확인',
    cancelLabel = '취소',
    danger = false,
}: AlertModalProps) {
    // onConfirm이 있으면 confirm 모드 (확인 + 취소 버튼),
    // 없으면 alert 모드 (닫기 버튼만)
    const isConfirmMode = typeof onConfirm === 'function';

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {/* 줄바꿈(\n)을 <br>로 처리하여 여러 줄 메시지 지원 */}
                <p>
                    {message.split('\n').map((line, i) => (
                        <span key={i}>
                            {line}
                            {i < message.split('\n').length - 1 && <br />}
                        </span>
                    ))}
                </p>
                <div className={styles.btnGroup}>
                    {isConfirmMode && (
                        <button className={styles.cancelBtn} onClick={onClose}>
                            {cancelLabel}
                        </button>
                    )}
                    <button
                        className={`${styles.confirmBtn} ${danger ? styles.dangerBtn : ''}`}
                        onClick={isConfirmMode ? onConfirm : onClose}
                    >
                        {isConfirmMode ? confirmLabel : '닫기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
