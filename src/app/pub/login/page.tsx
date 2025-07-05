'use client';

import styles from '@/styles/pages/login/login.module.scss';
import {Eye, EyeOff, Lock, LucideMail} from "lucide-react";
import {useState} from "react";
import AlertModal from "@/app/libs/global-components/AlertModal";
import Image from "next/image";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState<string>('');
    const [pwFocused, setPwFocused] = useState<boolean>(false);
    const [showModal, setShowModal] = useState(false);


    const isPwEnabled = email.trim().length > 0;

    const disabledSignBtn = password.trim().length === 0 || email.trim().length === 0


    return (
        <div className={styles.wrapper}>
            <header className={styles.header}>
                <Image src="/images/byzip_logo.png" alt="분양모음집 로고" loading="eager" priority/>
                <span>분양모음집-관리자</span>
            </header>

            {/*로그인 카드 */}
            <div className={styles.card}>
                <h2 className={styles.title}>환영합니다 👋</h2>

                <div className={styles.inputGroup}>
                    <label>ID</label>
                    <div className={`${styles.inputWithIcon} `}>
                        <LucideMail size={16}/>
                        <input type="text" placeholder="아이디를 입력하세요" value={email}
                               onChange={(e) => setEmail(e.target.value)}/>
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label>Password</label>
                    <div
                        className={`${styles.inputWithIcon} ${!isPwEnabled ? styles.fakeDisabled : ''} ${pwFocused ? styles.focused : ''}`}>
                        <Lock size={16}/>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setPwFocused(true)}
                            onBlur={() => setPwFocused(false)}
                        />
                        <button
                            type="button"
                            className={styles.eyeBtn}
                            onClick={() => setShowPassword((prev) => !prev)}
                        >
                            {showPassword ? <Eye size={16}/> : <EyeOff size={16}/>}
                        </button>
                    </div>
                </div>

                <div className={styles.optionRow}>
                    <label>
                        <input type="checkbox"/>
                        아이디 저장
                    </label>
                </div>


                <button className={styles.signInBtn}
                        disabled={disabledSignBtn}
                        onClick={() => setShowModal(true)}
                >Sign in
                </button>
                {showModal && (
                    <AlertModal message="회원 정보가 일치하지 않습니다." onClose={() => setShowModal(false)}/>
                )}

            </div>
        </div>
    );
}
