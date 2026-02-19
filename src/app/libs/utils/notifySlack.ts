import axios from 'axios';
import type { CreateBugReportDto } from 'byzip-v2-sdk';
import { BugReportErrorType, BugReportSeverity } from 'byzip-v2-sdk';

/**
 * Slack에 버그 리포트 알림을 전송하는 함수
 *
 * @param bugReportData - 버그 리포트 데이터
 *
 * @description
 * 버그 리포트 정보를 Slack 메시지 형식으로 변환하여 전송합니다.
 */
export const notifySlackBugReport = async (
  bugReportData: CreateBugReportDto,
): Promise<void> => {
  const webhookUrl = process.env.SLACK_BUG_REPORT_WEBHOOK_URL;

  // 개발 환경(로컬)에서는 Slack 알림을 보내지 않음
  if (process.env.NEXT_PUBLIC_BASE_URL === 'http://localhost:3000') {
    return;
  }

  if (!webhookUrl) {
    console.warn(
      '🔍 [Slack Notifier] SLACK_BUG_REPORT_WEBHOOK_URL이 설정되지 않았습니다.',
    );
    return;
  }

  try {
    // 심각도에 따른 이모지 및 색상 결정
    const severityEmoji =
      bugReportData.severity === BugReportSeverity.HIGH
        ? '🔴'
        : bugReportData.severity === BugReportSeverity.MEDIUM
          ? '🟡'
          : '🟢';

    const severityText =
      bugReportData.severity === BugReportSeverity.HIGH
        ? '높음'
        : bugReportData.severity === BugReportSeverity.MEDIUM
          ? '중간'
          : '낮음';

    const errorType = bugReportData.errorType || BugReportErrorType.UNKNOWN;

    // URL에서 도메인 추출
    const url = bugReportData.url || '알 수 없음';
    const urlDisplay = url.length > 80 ? `${url.substring(0, 80)}...` : url;

    // 발생 시간 포맷팅
    const now = new Date();
    const formattedTime = now.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // 버그 리포트 페이지 URL 구성
    const bugReportPageUrl = 'https://dev.by-zip.com/admin/bugs';

    // 메시지 구성
    const message = {
      text: `버그 리포트: ${bugReportData.title}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📢 버그 리포트',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*에러 타입:*\n${errorType}`,
            },
            {
              type: 'mrkdwn',
              text: `*심각도:*\n${severityEmoji} ${severityText}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*제목:*\n${bugReportData.title}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*설명:*\n${bugReportData.description || '설명 없음'}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*에러 발생 페이지:*\n<${url}|${urlDisplay}>`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*발생 시간:*\n${formattedTime}`,
          },
        },
        ...(bugReportData.errorStack
          ? [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*스택 트레이스:*\n\`\`\`${bugReportData.errorStack.substring(0, 1000)}${bugReportData.errorStack.length > 1000 ? '...' : ''}\`\`\``,
                },
              },
            ]
          : []),
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '버그 리포트 확인하러 가기',
                emoji: true,
              },
              style: 'primary',
              url: bugReportPageUrl,
            },
          ],
        },
      ],
    };

    await axios.post(webhookUrl, message, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000, // 5초 타임아웃
    });
  } catch (error) {
    console.warn('🔍 [Slack Notifier] Slack 알림 전송 실패:', error);
  }
};

/**
 * 담당자 변경 알림을 Slack으로 전송합니다.
 *
 * @param params.bugId - 버그 리포트 ID
 * @param params.title - 버그 제목
 * @param params.prevAssignee - 이전 담당자 (nullable)
 * @param params.nextAssignee - 변경된 담당자 (nullable)
 * @param params.occurredAt - 버그 발생일(ISO 문자열 또는 포맷된 문자열)
 * @param params.status - API 상태 문자열 (예: open, in_progress, resolved, closed)
 */
export const notifySlackAssigneeChange = async (params: {
  bugId: number;
  title?: string;
  nextAssignee?: string | null;
  occurredAt: string | null;
}): Promise<void> => {
  const webhookUrl = process.env.SLACK_ASSIGNEE_NOTIFIER_WEBHOOK_URL;

  // // 로컬 개발 환경에서는 전송하지 않음
  // if (process.env.NEXT_PUBLIC_BASE_URL === 'http://localhost:3000') return;

  if (!webhookUrl) {
    console.warn(
      '🔍 [Slack Notifier] SLACK_ASSIGNEE_NOTIFIER_WEBHOOK_URL이 설정되지 않았습니다.',
    );
    return;
  }

  try {
    const { bugId, title, nextAssignee, occurredAt } = params;

    // assignee id -> slack user id (멘션용)
    const SLACK_ID_MAP: Record<string, string> = {
      heereal: 'U04HJ6DT0HW',
      psh5575: 'U04GWUFE7C4',
      ys3: 'U04GUFB9SR0',
    };

    // occurredAt은 ISO 문자열로 들어옵니다(e.g. '2026-01-29T12:33:16.047Z').
    let occurredText = '-';
    if (occurredAt) {
      const d = new Date(occurredAt);
      if (!isNaN(d.getTime())) {
        occurredText = new Intl.DateTimeFormat('ko-KR', {
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
          .format(d)
          .replace(/\./g, '.')
          .replace(/\s/g, ' ')
          .replace(/:$/, '');
      }
    }

    const slackId = nextAssignee ? SLACK_ID_MAP[nextAssignee] : undefined;
    const nextAssigneeText = `<@${slackId}>`;

    const payload = {
      text: `👤 담당자 변경: ${nextAssigneeText} (${title ?? '제목 없음'})`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '👤 버그 담당자 변경 알림',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*버그 내용 (ID: ${bugId})*\n${title ?? '제목 없음'}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*버그 발생일*\n${occurredText}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*변경 담당자*\n${nextAssigneeText}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '버그 확인하기',
                emoji: true,
              },
              style: 'primary',
              url: `https://dev.by-zip.com/admin/bugs`,
            },
          ],
        },
      ],
    };

    await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
  } catch (err) {
    console.warn('🔍 [Slack Notifier] 담당자 변경 알림 전송 실패:', err);
  }
};
