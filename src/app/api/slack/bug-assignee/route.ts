import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const webhook = process.env.SLACK_ASSIGNEE_NOTIFIER_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json({ error: 'Missing webhook' }, { status: 500 });
  }

  const body = await req.json();


  const statusToLabel = (s?: string) => {
  switch (s) {
    case 'in-progress':
      return '🟢 해결중';
    case 'completed':
      return '🔵 해결완료';
    case 'needed':
      return '🟡 해결필요';
    case 'not-bug':
      return '⚪️ 버그아님';
    default:
      return s ? `ℹ️ ${s}` : 'ℹ️ -';
  }
};


  const occurredAt = body.occurredAt ?? '-';
  const statusLabel = statusToLabel(body.status);
  const prev = body.prevAssignee ?? '-';
  const next = body.nextAssignee ?? '-';



  const payload = {
    // 슬랙 푸시/미리보기 한 줄
    text: `👤 담당자 변경: ${prev} → ${next}`,

    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '👤 담당자 변경 알림',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*🙋 이전 담당자*\n${prev}` },
          { type: 'mrkdwn', text: `*🙋 변경 담당자*\n${next}` },
          { type: 'mrkdwn', text: `*📅 버그 발생일*\n${occurredAt}` },
          { type: 'mrkdwn', text: `*📌 버그 상태*\n${statusLabel}` },
        ],
      },
    ],
  };

  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return NextResponse.json({ ok: true });
}
