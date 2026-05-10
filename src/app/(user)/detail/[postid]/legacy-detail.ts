import 'server-only';

import type { LegacyHomeData, LegacyIndexResponse } from './types';

const LEGACY_SITE_URL = 'https://www.by-zip.com';
const LEGACY_REVALIDATE_SECONDS = 60 * 60;

async function fetchLegacyBuildId() {
  const response = await fetch(LEGACY_SITE_URL, {
    next: { revalidate: LEGACY_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error('분양모음집 홈 데이터를 불러오지 못했습니다.');
  }

  const html = await response.text();
  const match = html.match(/"buildId":"([^"]+)"/);

  if (!match?.[1]) {
    throw new Error('분양모음집 build id를 찾지 못했습니다.');
  }

  return match[1];
}

async function fetchLegacyHomeList() {
  const buildId = await fetchLegacyBuildId();
  const response = await fetch(
    `${LEGACY_SITE_URL}/_next/data/${buildId}/index.json`,
    {
      next: { revalidate: LEGACY_REVALIDATE_SECONDS },
    },
  );

  if (!response.ok) {
    throw new Error('분양모음집 공개 데이터를 불러오지 못했습니다.');
  }

  const data = (await response.json()) as LegacyIndexResponse;
  return data.pageProps?.homeList?.allHomeData ?? [];
}

export async function getLegacyDetail(postid: string) {
  const homeList = await fetchLegacyHomeList();

  return (
    homeList.find(
      (item: LegacyHomeData) =>
        item.PBLANC_NO === postid || String(item.PBLANC_NO) === postid,
    ) ?? null
  );
}
