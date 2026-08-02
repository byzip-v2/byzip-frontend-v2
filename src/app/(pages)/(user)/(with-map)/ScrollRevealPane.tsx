'use client';

import { useEffect, useRef, useState } from 'react';

import styles from './map-layout.module.scss';

interface ScrollRevealPaneProps {
  children: React.ReactNode;
}

export default function ScrollRevealPane({ children }: ScrollRevealPaneProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleScroll = () => {
    setIsScrolling(true);

    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 700);
  };

  return (
    <div
      className={`${styles.scrollPane} ${isScrolling ? styles.scrollPaneActive : ''} w-full bg-white md:h-full md:w-[60%] md:overflow-y-auto`}
      onScroll={handleScroll}
    >
      {children}
    </div>
  );
}
