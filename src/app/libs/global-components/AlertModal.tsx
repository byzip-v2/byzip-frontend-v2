'use client';

import styles from '@/styles/common/alertModal.module.scss';

interface AlertModalProps {
    message: string;
    onClose: () => void;
}

export default function AlertModal({message, onClose}: AlertModalProps) {
    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <p>{message}</p>
                <button className={styles.confirmBtn} onClick={onClose}>닫기</button>
            </div>
        </div>
    );
}
