import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

const baseConfig: NextConfig = {
  reactStrictMode: false, // Strict Mode 비활성화
};

export default function nextConfig(phase: string): NextConfig {
  return {
    ...baseConfig,
    // dev 서버와 build 결과물이 같은 .next를 쓰지 않도록 분리
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  };
}
