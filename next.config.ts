import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

const baseConfig: NextConfig = {
  reactStrictMode: false, // Strict Mode 비활성화
  // gRPC 및 Google Analytics SDK가 Webpack 번들링 과정에서 훼손되는 현상을 방지하기 위해 
  // Next.js RSC(서버사이드) 번들 외부 패키지로 지정합니다.
  serverExternalPackages: ['@google-analytics/data'],
};

export default function nextConfig(phase: string): NextConfig {
  return {
    ...baseConfig,
    // dev 서버와 build 결과물이 같은 .next를 쓰지 않도록 분리
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  };
}
