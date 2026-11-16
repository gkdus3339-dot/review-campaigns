export interface LinkedPage {
  url: string;
  text: string;
}

/** Read http(s) links from a win message. A reader fallback is used when the site blocks the browser. */
export async function loadLinkedPages(text: string): Promise<{ pages: LinkedPage[]; failed: string[] }> {
  const found = Array.from(text.matchAll(/https?:\/\/[^\s<>"'()[\]]+/gi), (match) =>
    match[0].replace(/[.,!?)\]]+$/, ""),
  );
  const urls = [...new Set(found)];
  const pages: LinkedPage[] = [];
  const failed: string[] = [];
  await Promise.all(
    urls.map(async (url) => {
        try {
          const text = await fetchReadable(url);
          if (isLoginWall(text)) throw new Error("private");
          pages.push({ url, text });
        } catch {
          failed.push(url);
        }
    }),
  );
  return { pages, failed };
}

function isLoginWall(text: string): boolean {
  const compact = text.replace(/\s+/g, " ");
  if (compact.length > 8000) return false;
  if (/제공\s*내역|캠페인\s*미션|예약\s*번호|방문\s*시간|리뷰\s*기간/.test(compact)) return false;
  return /비밀번호/.test(compact) && /로그인/.test(compact);
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
