'use server';

/**
 * 관리자 페이지 Server Actions
 * 서버 사이드에서 안전하게 사용자 정보를 조회합니다.
 */

import axios from 'axios';
import type { GetMeResponseDto } from 'byzip-v2-sdk';
import { serverApiWithToekn } from '@/app/libs/utils/api';
import type { ActionResult } from '@/app/libs/types/api';

/**
 * 사용자 정보 조회 Server Action
 *
 * @description
 * 1. 현재 사용자의 accessToken을 쿠키에서 가져옴
 * 2. Authorization 헤더에 토큰을 포함하여 /users/me API 호출
 * 3. 사용자 정보를 반환
 *
 * @returns 사용자 정보 조회 결과
 */
export async function getUserInfo(): Promise<ActionResult<GetMeResponseDto>> {
  try {
    // API 요청 (토큰 자동 포함)
    const response =
      await serverApiWithToekn.get<GetMeResponseDto>('/users/me');

    // SDK 응답 구조 검증
    if (response.status != 200 || !response.data) {
      return {
        success: false,
        message: '사용자 정보를 가져올 수 없습니다.',
      };
    }

    const userInfo = response.data;

    return {
      success: true,
      message: '사용자 정보를 성공적으로 가져왔습니다.',
      data: userInfo,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // HTTP 에러 응답
      if (error.response) {
        let errorMessage = '사용자 정보를 가져오는데 실패했습니다.';

        // 에러 응답 데이터 확인
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }

        return {
          success: false,
          message: errorMessage,
        };
      }
      // 네트워크 에러
      else if (error.request) {
        return {
          success: false,
          message: '네트워크 연결을 확인해주세요.',
        };
      }
    }

    // 기타 모든 에러
    return {
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}
