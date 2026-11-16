export interface LinkedPage {
  url: string;
  text: string;
}

const NOISE_LINK = /bit\.ly|bitly\.com|tinyurl\.com|(?:^|\/\/|\.)goo\.gl|t\.co\/|han\.gl|vo\.la|naver\.me|kko\.to|map\.naver|map\.kakao|maps\.google|maps\.app\.goo|place\.map|google\.com\/maps|instagram\.com|facebook\.com|youtube\.com|youtu\.be|blog\.naver|pf\.kakao|open\.kakao/i;
const TALK_LINK = /talk\.naver\.com|nid\.naver\.com|nidlogin/i;
const CAMPAIGN_LINK = /campaign|detail\.php|\/detail\/|\/taste\/|\/cp\/|[?&](?:c|number|id|idx)=/i;
const PLATFORM_HOST = /revu\.net|dinnerqueen\.net|reviewnote\.co\.kr|mrblog\.net|seoulouba\.co\.kr|reviewplace\.co\.kr|ringble\.co\.kr|xn--939au0g4vj8sq|강남맛집\.net/i;

export function messageUrls(text: string): string[] {
  const found = Array.from(text.matchAll(/https?:\/\/[^\s<>"'()[\]]+/gi), (match) =>
    match[0].replace(/[.,!?)\]]+$/, ""),
  );
  return [...new Set(found)];
}

/** Instruction shorts, maps, and social profiles are not the campaign page. */
export function isNoiseLink(url: string): boolean {
  return NOISE_LINK.test(url);
}

export function isTalkLink(url: string): boolean {
  return TALK_LINK.test(url);
}

/** A campaign homepage, including platforms other than the built-in list. */
export function isCampaignLink(url: string): boolean {
  if (isNoiseLink(url) || isTalkLink(url)) return false;
  if (PLATFORM_HOST.test(url) || CAMPAIGN_LINK.test(url)) return true;
  try {
    const parsed = new URL(url);
    return parsed.pathname.length > 1 || parsed.search.length > 1;
  } catch {
    return false;
  }
}

/** Read the campaign page inside a win message. Short links and login-only talk links are skipped. */
export async function loadLinkedPages(text: string): Promise<{ pages: LinkedPage[]; failed: string[] }> {
  const urls = messageUrls(text).filter((url) => !isNoiseLink(url));
  const pages: LinkedPage[] = [];
  const failed: string[] = [];
  await Promise.all(
    urls.map(async (url) => {
      try {
        const body = await fetchReadable(url);
        if (isLoginWall(body)) {
          if (!isTalkLink(url)) failed.push(url);
          return;
        }
        pages.push({ url, text: body });
      } catch {
        failed.push(url);
      }
    }),
  );
  return { pages, failed };
}

function isLoginWall(text: string): boolean {
  if (/제공\s*내역|제공내역|리뷰어\s*미션|캠페인\s*미션|예약\s*번호|방문\s*가능\s*시간|필수\s*키워드|식사\s*체험|리뷰\s*등록\s*기간|리뷰\s*기간/.test(text)) {
    return false;
  }
  const compact = text.replace(/\s+/g, " ").slice(0, 5000);
  return /로그인|sign in|log in/i.test(compact) && /비밀번호|password/i.test(compact);
}

async function fetchReadable(url: string): Promise<string> {
  const targets = /^https?:\/\/r\.jina\.ai\//i.test(url) ? [url] : [url, `https://r.jina.ai/${url}`];
  let last: unknown = null;
  for (const target of targets) {
    try {
      return await fetchText(target);
    } catch (error) {
      last = error;
    }
  }
  throw last instanceof Error ? last : new Error("fetch failed");
}

async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const response = await fetch(url, { signal: ctrl.signal, credentials: "omit", redirect: "follow" });
    if (!response.ok) throw new Error(String(response.status));
    const text = await response.text();
    if (text.trim().length < 40) throw new Error("empty");
    return text;
  } finally {
    clearTimeout(timer);
  }
}
