/* Generated from src/lib. Same rules as the Next.js app. */
(function (root) {
"use strict";
function __uuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 3 | 8)).toString(16);
  });
}
/* src/lib/dates.ts */
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
function pad(n) {
    return String(n).padStart(2, "0");
}
function toISO(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function todayISO() {
    return toISO(new Date());
}
function parseISO(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
}
function isValidISO(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
        return false;
    const d = parseISO(value);
    return toISO(d) === value;
}
/** Whole days from `from` to `to` (positive when `to` is later). */
function diffDays(from, to) {
    return Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 86400000);
}
function dDayLabel(days) {
    if (days === 0)
        return "D-DAY";
    return days > 0 ? `D-${days}` : `D+${-days}`;
}
function formatShort(iso) {
    if (!iso)
        return "";
    const d = parseISO(iso);
    return `${d.getMonth() + 1}.${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}
function formatRange(start, end) {
    if (!start && !end)
        return "";
    if (start && end)
        return `${formatShort(start)} ~ ${formatShort(end)}`;
    return start ? `${formatShort(start)} ~` : `~ ${formatShort(end)}`;
}
/** "11:00" + "15:00" → "11:00–15:00". */
function formatTimeRange(start, end) {
    if (start && end)
        return `${start}–${end}`;
    return start || end || "";
}
function monthKey(iso) {
    return iso.slice(0, 7);
}
function monthLabel(key) {
    const [y, m] = key.split("-").map(Number);
    return `${y}년 ${m}월`;
}
function addMonths(key, delta) {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/* src/lib/types.ts */
const STATUSES = ["당첨", "방문 예정", "방문 완료", "리뷰 작성 완료", "종료", "취소"];
const FLOW_STATUSES = ["당첨", "방문 예정", "방문 완료", "리뷰 작성 완료", "종료"];
const CATEGORIES = ["맛집", "카페", "뷰티", "숙박", "제품", "생활/서비스", "기타"];
const DEFAULT_PLATFORMS = ["레뷰", "강남맛집", "디너의여왕", "리뷰노트", "링블", "기타"];
function emptyCampaign(today) {
    return {
        platform: "",
        business_name: "",
        category: "",
        offer: "",
        amount: null,
        region: "",
        phone: "",
        visit_start: null,
        visit_end: null,
        visit_time_start: null,
        visit_time_end: null,
        visit_time_note: "",
        visit_date: null,
        deadline: null,
        won_date: today,
        keywords: "",
        guide: "",
        mission: "",
        campaign_url: "",
        review_url: "",
        status: "당첨",
    };
}
/** Statuses where the review still has to be written. */
function needsReview(status) {
    return status === "당첨" || status === "방문 예정" || status === "방문 완료";
}
function needsVisit(status) {
    return status === "당첨" || status === "방문 예정";
}
function isReviewDone(status) {
    return status === "리뷰 작성 완료" || status === "종료";
}
function isSafeUrl(value) {
    return /^https?:\/\/[^\s]+$/i.test(value);
}

/* src/lib/money.ts */
function formatWon(amount) {
    if (amount == null)
        return "";
    return `${amount.toLocaleString("ko-KR")}원`;
}
/** Compact form for chart labels: 125000 -> "12.5만". */
function formatManwon(amount) {
    if (amount === 0)
        return "0";
    if (amount < 10000)
        return `${(amount / 10000).toFixed(1).replace(/\.0$/, "")}만`;
    const man = amount / 10000;
    return `${man >= 100 ? Math.round(man) : Number(man.toFixed(1))}만`;
}

/* src/lib/fields.ts */
const CAMPAIGN_FIELDS = [
    "platform",
    "business_name",
    "category",
    "offer",
    "amount",
    "region",
    "phone",
    "visit_start",
    "visit_end",
    "visit_time_start",
    "visit_time_end",
    "visit_time_note",
    "visit_date",
    "deadline",
    "won_date",
    "keywords",
    "guide",
    "mission",
    "campaign_url",
    "review_url",
    "status",
];

/* src/lib/validate.ts */
const LIMITS = {
    platform: 40,
    business_name: 120,
    category: 40,
    offer: 1000,
    region: 300,
    phone: 300,
    visit_time_note: 300,
    keywords: 1000,
    guide: 5000,
    mission: 8000,
    campaign_url: 2000,
    review_url: 2000,
};
class ValidationError extends Error {
}
function text(value, field) {
    if (value == null)
        return "";
    if (typeof value !== "string")
        throw new ValidationError(`${field}: 문자열이어야 합니다`);
    const trimmed = value.trim();
    if (trimmed.length > LIMITS[field])
        throw new ValidationError(`${field}: 너무 깁니다`);
    return trimmed;
}
function date(value, field) {
    if (value == null || value === "")
        return null;
    if (!isValidISO(value))
        throw new ValidationError(`${field}: 날짜 형식이 올바르지 않습니다`);
    return value;
}
function clock(value, field) {
    if (value == null || value === "")
        return null;
    if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
        throw new ValidationError(`${field}: 시간 형식이 올바르지 않습니다`);
    }
    return value;
}
function url(value, field) {
    const v = text(value, field);
    if (v !== "" && !isSafeUrl(v))
        throw new ValidationError(`${field}: http(s) 주소만 입력할 수 있습니다`);
    return v;
}
function amount(value) {
    if (value == null || value === "")
        return null;
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 1_000_000_000)
        throw new ValidationError("amount: 올바른 금액이 아닙니다");
    return n;
}
function status(value) {
    if (value == null || value === "")
        return "당첨";
    if (!STATUSES.includes(value))
        throw new ValidationError("status: 알 수 없는 상태입니다");
    return value;
}
const PARSERS = {
    platform: (v) => text(v, "platform"),
    business_name: (v) => text(v, "business_name"),
    category: (v) => text(v, "category"),
    offer: (v) => text(v, "offer"),
    amount,
    region: (v) => text(v, "region"),
    phone: (v) => text(v, "phone"),
    visit_start: (v) => date(v, "visit_start"),
    visit_end: (v) => date(v, "visit_end"),
    visit_time_start: (v) => clock(v, "visit_time_start"),
    visit_time_end: (v) => clock(v, "visit_time_end"),
    visit_time_note: (v) => text(v, "visit_time_note"),
    visit_date: (v) => date(v, "visit_date"),
    deadline: (v) => date(v, "deadline"),
    won_date: (v) => date(v, "won_date"),
    keywords: (v) => text(v, "keywords"),
    guide: (v) => text(v, "guide"),
    mission: (v) => text(v, "mission"),
    campaign_url: (v) => url(v, "campaign_url"),
    review_url: (v) => url(v, "review_url"),
    status,
};

/** Validates a full campaign (create) or only the given fields (update). */
function parseCampaign(body, partial) {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        throw new ValidationError("잘못된 요청입니다");
    }
    const input = body;
    const out = {};
    for (const field of CAMPAIGN_FIELDS) {
        if (partial && !(field in input))
            continue;
        out[field] = PARSERS[field](input[field]);
    }
    if ((!partial || "business_name" in input) && !out.business_name) {
        throw new ValidationError("업체명을 입력해 주세요");
    }
    return out;
}
function parsePlatforms(body) {
    const list = body?.platforms;
    if (!Array.isArray(list) || list.length > 30)
        throw new ValidationError("플랫폼 목록이 올바르지 않습니다");
    const names = [];
    for (const item of list) {
        const name = text(item, "platform");
        if (name && !names.includes(name))
            names.push(name);
    }
    return names;
}

/* src/lib/store.ts */
const STORAGE_KEY = "review-notes.v1";
const MAX_CAMPAIGNS = 5000;
function empty() {
    return { campaigns: [], platforms: [...DEFAULT_PLATFORMS] };
}
function read() {
    let raw;
    try {
        raw = localStorage.getItem(STORAGE_KEY);
    }
    catch {
        throw new Error("이 브라우저에는 저장할 수 없습니다");
    }
    if (!raw)
        return empty();
    try {
        const parsed = JSON.parse(raw);
        const campaigns = Array.isArray(parsed.campaigns)
            ? parsed.campaigns.flatMap((row) => {
                const campaign = asCampaign(row);
                return campaign ? [campaign] : [];
            })
            : [];
        campaigns.sort((a, b) => b.created_at.localeCompare(a.created_at));
        return {
            campaigns,
            platforms: asPlatforms(parsed.platforms),
        };
    }
    catch (error) {
        if (error instanceof ValidationError)
            throw error;
        return empty();
    }
}
function write(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    catch (error) {
        const name = error instanceof DOMException ? error.name : "";
        if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
            throw new Error("이 기기의 저장 공간이 부족합니다");
        }
        throw new Error("이 브라우저에는 저장할 수 없습니다");
    }
}
function asPlatforms(value) {
    try {
        return parsePlatforms({ platforms: value });
    }
    catch {
        return [...DEFAULT_PLATFORMS];
    }
}
function asCampaign(value) {
    if (typeof value !== "object" || value === null)
        return null;
    const row = value;
    if (typeof row.id !== "string" || row.id.length === 0 || row.id.length > 80)
        return null;
    try {
        const fields = parseCampaign(row, false);
        const created = typeof row.created_at === "string" && row.created_at.length >= 10 ? row.created_at : new Date().toISOString();
        const updated = typeof row.updated_at === "string" ? row.updated_at : created;
        return { id: row.id, ...fields, created_at: created, updated_at: updated };
    }
    catch {
        return null;
    }
}
function ensurePlatform(list, name) {
    if (!name || list.includes(name))
        return list;
    const next = list.slice();
    const etc = next.indexOf("기타");
    if (etc >= 0)
        next.splice(etc, 0, name);
    else
        next.push(name);
    return next;
}
function loadLocal() {
    return read();
}
function createLocal(input) {
    const data = read();
    if (data.campaigns.length >= MAX_CAMPAIGNS)
        throw new Error("저장할 수 있는 캠페인 수를 초과했습니다");
    const fields = parseCampaign(input, false);
    const now = new Date().toISOString();
    const campaign = { id: __uuid(), ...fields, created_at: now, updated_at: now };
    data.campaigns.unshift(campaign);
    write(data);
    return campaign;
}
function updateLocal(id, patch) {
    const data = read();
    const index = data.campaigns.findIndex((c) => c.id === id);
    if (index < 0)
        throw new Error("캠페인을 찾을 수 없습니다");
    const fields = parseCampaign(patch, true);
    const campaign = { ...data.campaigns[index], ...fields, updated_at: new Date().toISOString() };
    data.campaigns[index] = campaign;
    write(data);
    return campaign;
}
function removeLocal(id) {
    const data = read();
    const next = data.campaigns.filter((c) => c.id !== id);
    if (next.length === data.campaigns.length)
        throw new Error("캠페인을 찾을 수 없습니다");
    data.campaigns = next;
    write(data);
}
function savePlatformsLocal(platforms) {
    const data = read();
    data.platforms = parsePlatforms({ platforms });
    write(data);
    return data.platforms;
}

/* src/lib/events.ts */
const EVENT_LABEL = {
    visit: "방문",
    visitEnd: "방문 기한",
    deadline: "리뷰 마감",
};
/** Visit dates (or the end of the visit window when no visit is booked) and review deadlines. */
function campaignEvents(campaigns) {
    const events = [];
    for (const c of campaigns) {
        if (c.status === "취소")
            continue;
        const visitDone = !needsVisit(c.status);
        if (c.visit_date) {
            events.push({ key: `${c.id}:visit`, kind: "visit", date: c.visit_date, campaign: c, done: visitDone });
        }
        else if (c.visit_end && !visitDone) {
            events.push({ key: `${c.id}:visitEnd`, kind: "visitEnd", date: c.visit_end, campaign: c, done: false });
        }
        if (c.deadline) {
            events.push({
                key: `${c.id}:deadline`,
                kind: "deadline",
                date: c.deadline,
                campaign: c,
                done: isReviewDone(c.status),
            });
        }
    }
    return events;
}
/** Open events, overdue first, then by date; same-day visits before deadlines. */
function upcomingEvents(campaigns, today) {
    const order = { visit: 0, visitEnd: 1, deadline: 2 };
    return campaignEvents(campaigns)
        .filter((e) => !e.done && (e.kind !== "deadline" || needsReview(e.campaign.status)))
        .sort((a, b) => {
        const da = diffDays(today, a.date);
        const db = diffDays(today, b.date);
        if (da !== db)
            return da - db;
        return order[a.kind] - order[b.kind];
    });
}

/* src/lib/stats.ts */
/** Month a campaign's savings count toward: visit date, else win date, else creation date. */
function savingsMonth(c) {
    if (c.visit_date)
        return monthKey(c.visit_date);
    if (c.won_date)
        return monthKey(c.won_date);
    return monthKey(c.created_at.slice(0, 10));
}
function monthlySavings(campaigns) {
    const months = new Map();
    for (const c of campaigns) {
        if (c.status === "취소")
            continue;
        const key = savingsMonth(c);
        const stat = months.get(key) ?? { key, total: 0, campaigns: [] };
        stat.total += c.amount ?? 0;
        stat.campaigns.push(c);
        months.set(key, stat);
    }
    return months;
}
function recentMonths(months, currentKey, count) {
    const result = [];
    for (let i = count - 1; i >= 0; i--) {
        const key = addMonths(currentKey, -i);
        result.push(months.get(key) ?? { key, total: 0, campaigns: [] });
    }
    return result;
}
function yearSummary(months, year) {
    let total = 0;
    let count = 0;
    for (const stat of months.values()) {
        if (!stat.key.startsWith(`${year}-`))
            continue;
        total += stat.total;
        count += stat.campaigns.length;
    }
    return { total, count };
}

/* src/lib/parser.ts */
const DATE_FIELDS = new Set(["visitPeriod", "visitDate", "deadline", "won"]);
const MULTILINE_FIELDS = new Set(["offer", "keywords", "guide"]);
const LABELS = [
    ["platform", "플랫폼"],
    ["phone", "예약\\s*전화|예약\\s*번호|연락할\\s*번호|연락\\s*처|전화\\s*번호|전화번호|휴대폰\\s*번호|휴대폰|핸드폰|휴대\\s*전화|예약\\s*문의|문의\\s*(?:전화|번호)|네이버\\s*톡톡|톡톡"],
    ["business", "업체\\s*명|상호\\s*명?|매장\\s*명|가게\\s*명|캠페인\\s*명|브랜드\\s*명?|체험단\\s*명|업체|매장"],
    ["link", "캠페인\\s*(?:링크|주소|URL|상세)|상세\\s*(?:페이지|링크)|링크|URL"],
    ["amount", "제공\\s*금액|제공\\s*가격?|상당\\s*금액|금액|가격|정가"],
    [
        "offer",
        "제공\\s*(?:내역|내용|서비스|상품|품목|메뉴|사항)|제공품|제공|혜택|체험\\s*(?:내용|상품|메뉴)|지원\\s*내역|리워드|제품",
    ],
    ["address", "(?:매장|방문|업체|업장)\\s*(?:주소|위치)|주소|위치|지역|장소"],
    [
        "visitTime",
        "방문\\s*가능\\s*시간|방문\\s*시간|체험\\s*시간|운영\\s*시간|영업\\s*시간|이용\\s*가능\\s*시간|이용\\s*시간|예약\\s*가능\\s*시간",
    ],
    [
        "visitPeriod",
        "방문\\s*가능\\s*(?:기간|일정)|방문\\s*(?:기간|일정|기한)|체험\\s*(?:가능\\s*)?(?:기간|일정)|이용\\s*(?:가능\\s*)?기간|사용\\s*기간",
    ],
    ["visitDate", "방문\\s*예약\\s*일(?:시|자)?|방문\\s*(?:일시|일자|날짜)|방문일|예약\\s*(?:일시|일자|날짜)|예약일|체크인"],
    [
        "deadline",
        "(?:리뷰|후기|포스팅|콘텐츠|컨텐츠|원고|결과물|게시물)\\s*(?:등록|작성|업로드|제출)?\\s*(?:마감\\s*일?|기간|기한)|(?:등록|작성|제출)\\s*(?:마감\\s*일?|기한)|최종\\s*마감\\s*일?|마감\\s*일?",
    ],
    ["keywords", "필수\\s*(?:키워드|태그|해시태그)|키워드|해시\\s*태그|태그"],
    [
        "guide",
        "(?:작성|리뷰|포스팅)\\s*가이드(?:라인)?|가이드(?:라인)?|(?:유의|주의|필수|요청|안내|참고|전달)\\s*사항|패널티|페널티",
    ],
    ["category", "카테고리|분야|유형"],
    ["won", "당첨\\s*일|선정\\s*일|발표\\s*일"],
];
const LABEL_RES = LABELS.map(([field, pattern]) => ({
    field,
    re: new RegExp(`^(?:[\\[【<〈(]\\s*)?(${pattern})\\s*(?:([\\]】>〉)])\\s*[:：]?|([:：])|(\\s+[-–]\\s+)|(\\s+)|(?=$))\\s*(.*)$`, "iu"),
}));
const BULLET_RE = /^(?:[\s\-–—•·∙*▶►▷▸▹■□◆◇●○◎※✔✓☑✅❗❕❤⭐️→>]|\p{Extended_Pictographic}|\uFE0F|\u200D|\d{1,2}[.)]\s)+/u;
const REGION_WORDS = "서울|경기|인천|부산|대구|대전|광주|울산|세종|강원|충북|충남|충청|전북|전남|전라|경북|경남|경상|제주";
/** A short "key: value" line, which ends a multi-line block even when the key is not a known label. */
const KEY_VALUE_RE = /^[^\s:]{1,10}(?:\s[^\s:]{1,6})?\s*:\s*\S/u;
const PENALTY_RE = /패널티|페널티|위약|보증금|벌금|환수|청구|배송비|추가\s*(?:금액|요금|비용)|추가금|자부담|초과|본인\s*부담|차감/;
const KNOWN_PLATFORMS = [
    { name: "레뷰", re: /레뷰|\brevu\b/i, domain: /revu\.net/i },
    { name: "강남맛집", re: /강남맛집/, domain: /xn--939au0g4vj8sq|강남맛집\.net/i },
    { name: "디너의여왕", re: /디너의\s*여왕/, domain: /dinnerqueen\.net/i },
    { name: "리뷰노트", re: /리뷰노트/, domain: /reviewnote\.co\.kr/i },
    { name: "미블", re: /미블/, domain: /mrblog\.net/i },
    { name: "서울오빠", re: /서울오빠/, domain: /seoulouba\.co\.kr/i },
    { name: "리뷰플레이스", re: /리뷰플레이스/, domain: /reviewplace\.co\.kr/i },
    { name: "링블", re: /링블|\bringble\b/i, domain: /ringble\.co\.kr/i },
];
const CATEGORY_RULES = [
    ["제품", /배송|택배|발송|수령|제품\s*체험|쿠팡|스마트스토어|정가/g],
    ["숙박", /숙박|호텔|펜션|리조트|글램핑|캠핑장|풀빌라|객실|1박|스테이|모텔|게스트\s*하우스|체크인/g],
    ["뷰티", /헤어|펌|염색|네일|속눈썹|왁싱|피부|에스테틱|마사지|스파|두피|문신|smp|눈썹|미용실|살롱|뷰티|메이크업|세럼|화장품|피부과/gi],
    ["카페", /카페|커피|디저트|베이커리|브런치|케이크|빵집|라떼/g],
    [
        "맛집",
        /식사|메뉴|코스|맛집|레스토랑|식당|고기|오마카세|파스타|횟집|술집|이자카야|정식|요리|치킨|피자|족발|곱창|와인|스시|초밥|한우|삼겹|디너|런치|노포/g,
    ],
    ["생활/서비스", /필라테스|요가|PT|헬스|클래스|공방|사진관|스튜디오|세차|청소|키즈|학원|레슨|인테리어/g],
];
function inferYear(month, day, today) {
    const ref = parseISO(today);
    const year = ref.getFullYear();
    const candidate = toISO(new Date(year, month - 1, day));
    const diff = diffDays(today, candidate);
    if (diff < -180)
        return year + 1;
    if (diff > 185)
        return year - 1;
    return year;
}
function makeISO(year, month, day) {
    const iso = `${year}-${pad(month)}-${pad(day)}`;
    return isValidISO(iso) ? iso : null;
}
const WEEKDAY_SUFFIX = String.raw `(?:\s*[(（]\s*[월화수목금토일](?:요일)?\s*[)）]|\s*[월화수목금토일]요일)?`;
const NOT_AMOUNT = String.raw `(?!\s*(?:만|천|원|%|개|인|명|박|시간|분|ml|g\b|kg|cm|mm))`;
const DATE_PATTERNS = [
    {
        re: new RegExp(String.raw `(?<!\d)(20\d{2})\s*(?:[.\-/]|년)\s*(\d{1,2})\s*(?:[.\-/]|월)\s*(\d{1,2})(?!\d)\s*일?\.?` + WEEKDAY_SUFFIX, "gu"),
        kind: "ymd",
    },
    {
        re: new RegExp(String.raw `(?<![\d.])(\d{2})\.(\d{1,2})\.(\d{1,2})(?![\d.])` + NOT_AMOUNT + WEEKDAY_SUFFIX, "gu"),
        kind: "yymd",
    },
    {
        re: new RegExp(String.raw `(?<!\d)(\d{2})-(\d{1,2})-(\d{1,2})(?!\d)` + WEEKDAY_SUFFIX, "gu"),
        kind: "yymd",
    },
    {
        re: new RegExp(String.raw `(?<![\d.,])(\d{1,2})\s*(?:([./\-])|월)\s*(\d{1,2})(?![\d,])\s*(?:일(?!\s*(?:이내|전|후|간|내))\.?)?` + NOT_AMOUNT + WEEKDAY_SUFFIX, "gu"),
        kind: "md",
    },
];
function findDates(text, today) {
    const tokens = [];
    const taken = [];
    const overlaps = (s, e) => taken.some(([a, b]) => s < b && e > a);
    for (const { re, kind } of DATE_PATTERNS) {
        re.lastIndex = 0;
        for (const m of text.matchAll(re)) {
            const start = m.index ?? 0;
            const end = start + m[0].length;
            if (overlaps(start, end))
                continue;
            let iso = null;
            if (kind === "ymd")
                iso = makeISO(Number(m[1]), Number(m[2]), Number(m[3]));
            else if (kind === "yymd")
                iso = makeISO(2000 + Number(m[1]), Number(m[2]), Number(m[3]));
            else {
                const month = Number(m[1]);
                const day = Number(m[3]);
                // "3-5" style ranges of counts are far more common than dates written with a dash and no year.
                if (m[2] === "-" && !/\d{1,2}\s*-\s*\d{1,2}\s*[(（]/.test(m[0]))
                    continue;
                if (month >= 1 && month <= 12)
                    iso = makeISO(inferYear(month, day, today), month, day);
            }
            if (!iso)
                continue;
            tokens.push({ iso, start, end: end });
            taken.push([start, end]);
        }
    }
    return tokens.sort((a, b) => a.start - b.start);
}
const RANGE_SEP = /^\s*(?:[~∼〜\-–—]|부터\s*~?|에서)\s*/;
function findRanges(text, today) {
    const tokens = findDates(text, today);
    const ranges = [];
    const singles = [];
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const after = text.slice(t.end);
        const sep = after.match(RANGE_SEP);
        if (sep) {
            const next = tokens[i + 1];
            const gap = text.slice(t.end, next?.start ?? t.end);
            const gapWithoutYear = gap.replace(/20\d{2}\s*년?|\d{2}\s*년/g, "");
            if (next && RANGE_SEP.test(gap) && gapWithoutYear.trim().length <= 3 + (gap.includes("부터") ? 2 : 0)) {
                let end = next.iso;
                if (end < t.iso && !/20\d{2}/.test(text.slice(next.start, next.end))) {
                    const d = parseISO(end);
                    end = toISO(new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()));
                }
                ranges.push({ start: t.iso, end });
                i++;
                continue;
            }
            // "11.15~30": same month, day only.
            const dayOnly = after.slice(sep[0].length).match(/^(\d{1,2})(?!\s*[./\-월\d년])\s*일?/);
            if (dayOnly) {
                const s = parseISO(t.iso);
                const iso = makeISO(s.getFullYear(), s.getMonth() + 1, Number(dayOnly[1]));
                if (iso && iso >= t.iso) {
                    ranges.push({ start: t.iso, end: iso });
                    continue;
                }
            }
        }
        const before = text.slice(Math.max(0, t.start - 3), t.start);
        if (/[~∼〜]\s*$/.test(before)) {
            ranges.push({ start: null, end: t.iso });
            continue;
        }
        singles.push(t);
    }
    return { ranges, singles };
}
function plainSchedule(line) {
    return line.replace(/[#*`]/g, "").replace(/[:：]\s*$/u, "").trim();
}
function isMenuWord(value) {
    const compact = value.replace(/\s+/g, "");
    return compact.length > 0 && compact.length <= 12 && /^(?:로그인|회원가입|마이페이지|고객센터|제품|방문|인스타|유튜브|기자단|커뮤니티|마감임박|검색|홈|공지|스토리|리워드|꿀팁|안내|캠페인|뒤로가기|맛집보기)$/.test(compact);
}
function isScheduleHeading(line) {
    return /^(?:신청\s*기간|모집\s*기간|발표\s*(?:날짜|일)|당첨자\s*발표일|리뷰\s*(?:등록\s*)?기간)$/.test(plainSchedule(line));
}
/** Date lines that belong to 신청/발표/리뷰 headings, so they are not a visit window. */
function scheduleDateLines(lines, today) {
    const skip = new Set();
    for (let i = 0; i < lines.length; i++) {
        if (!isScheduleHeading(lines[i]))
            continue;
        let seen = 0;
        for (let j = i + 1; j < lines.length && seen < 8; j++) {
            const line = plainSchedule(lines[j]);
            if (!line)
                continue;
            seen++;
            if (isScheduleHeading(lines[j]))
                continue;
            const found = findRanges(line, today);
            if (found.ranges.length === 0 && found.singles.length === 0)
                break;
            skip.add(j);
        }
    }
    return skip;
}
/** When 신청/발표/리뷰 headings are stacked above the dates, the last range is the review window. */
function stackedReviewDeadline(lines, today) {
    for (let i = lines.length - 1; i >= 0; i--) {
        if (!/^리뷰\s*(?:등록\s*)?기간$/.test(plainSchedule(lines[i])))
            continue;
        const ranges = [];
        let seen = 0;
        for (let j = i + 1; j < lines.length && seen < 8; j++) {
            const line = plainSchedule(lines[j]);
            if (!line)
                continue;
            seen++;
            if (isScheduleHeading(lines[j]))
                continue;
            const found = findRanges(line, today);
            if (found.ranges.length === 0 && found.singles.length === 0) {
                if (ranges.length)
                    break;
                continue;
            }
            ranges.push(...found.ranges);
        }
        if (ranges.length)
            return ranges[ranges.length - 1].end;
    }
    return null;
}
function findAmounts(text) {
    const found = [];
    const taken = [];
    const push = (value, start, end) => {
        if (value <= 0 || value > 100_000_000)
            return;
        if (taken.some(([a, b]) => start < b && end > a))
            return;
        taken.push([start, end]);
        const tail = text.slice(end, end + 6);
        found.push({ value, index: start, sangdang: /^\s*(?:원\s*)?(?:상당|권|이용권|상품권)/.test(tail) });
    };
    for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*만\s*(?:(\d)\s*천\s*|(\d{1,4})\s*(?=원))?\s*(원|\s*상당|원권)/g)) {
        let value = Math.round(Number(m[1]) * 10000);
        if (m[2])
            value += Number(m[2]) * 1000;
        if (m[3])
            value += Number(m[3]);
        push(value, m.index ?? 0, (m.index ?? 0) + m[0].length);
    }
    for (const m of text.matchAll(/(?<![\d.])(\d+)\s*천\s*원/g)) {
        push(Number(m[1]) * 1000, m.index ?? 0, (m.index ?? 0) + m[0].length);
    }
    for (const m of text.matchAll(/(?:₩\s*(\d{1,3}(?:,\d{3})+|\d{4,})|(?<![\d.])(\d{1,3}(?:,\d{3})+|\d{4,})\s*원)/g)) {
        const raw = (m[1] ?? m[2]).replace(/,/g, "");
        push(Number(raw), m.index ?? 0, (m.index ?? 0) + m[0].length);
    }
    return found.sort((a, b) => a.index - b.index);
}
function pickAmount(text) {
    const amounts = findAmounts(text);
    if (amounts.length === 0)
        return null;
    const sangdang = amounts.filter((a) => a.sangdang);
    const pool = sangdang.length ? sangdang : amounts;
    return Math.max(...pool.map((a) => a.value));
}
// ---------------------------------------------------------------------------
// Helpers
function normalize(text) {
    return text
        .replace(/\r\n?/g, "\n")
        .replace(/[\u200B\u200C\uFEFF]/g, "")
        .replace(/[：]/g, ":")
        .replace(/[～〜∼]/g, "~")
        .replace(/\u00A0/g, " ")
        .replace(/[ \t]+/g, " ");
}
function cleanLine(line) {
    return line.replace(BULLET_RE, "").trim();
}
function matchLabel(line) {
    let best = null;
    for (const { field, re } of LABEL_RES) {
        const m = line.match(re);
        if (!m)
            continue;
        const [, label, bracket, colon, dash, space, value] = m;
        const strongSep = Boolean(bracket || colon || dash);
        if (!strongSep && space && !DATE_FIELDS.has(field))
            continue;
        if (!strongSep && !space && value)
            continue;
        if (!strongSep && DATE_FIELDS.has(field) && !/\d/.test(value))
            continue;
        if (!best || label.length > best.labelLen)
            best = { field, labelLen: label.length, value: value.trim() };
    }
    return best ? { field: best.field, value: best.value } : null;
}
function stripUrls(text) {
    return text.replace(/https?:\/\/\S+/gi, "").trim();
}
function normalizeKeywords(raw) {
    const text = stripUrls(raw);
    const parts = text.includes("#")
        ? (text.match(/#[^#\s,]+/g) ?? []).map((t) => t.slice(1))
        : text.split(/[,，、/\n·|]+/);
    const seen = [];
    for (const p of parts) {
        const k = p.replace(/^["'“”‘’\s]+|["'“”‘’\s.]+$/g, "").trim();
        if (k && !seen.includes(k))
            seen.push(k);
    }
    return seen.join(", ");
}
function cleanBusinessName(raw, platformNames) {
    let name = raw
        .replace(new RegExp(`^\\s*[\\[【(][^\\]】)]*[\\]】)]\\s*`), "")
        .replace(/["'“”‘’「」『』<>《》]/g, "")
        .replace(/\s*(?:체험단|캠페인|리뷰어?|기자단|모집|선정|당첨)\s*$/g, "")
        .trim();
    for (const p of platformNames) {
        if (name.startsWith(p + " "))
            name = name.slice(p.length).trim();
    }
    return name.slice(0, 120);
}
function mapCategory(raw) {
    const hit = CATEGORIES.find((c) => raw.includes(c));
    if (hit)
        return hit;
    return inferCategory(raw) ?? raw.slice(0, 40);
}
function inferCategory(text) {
    let best = null;
    let bestScore = 0;
    for (const [category, re] of CATEGORY_RULES) {
        const score = (text.match(re) ?? []).length * (category === "제품" ? 2 : 1);
        if (score > bestScore) {
            best = category;
            bestScore = score;
        }
    }
    return best;
}
function detectPlatform(text, urls, userPlatforms) {
    for (const url of urls) {
        const hit = KNOWN_PLATFORMS.find((p) => p.domain?.test(url));
        if (hit)
            return hit.name;
    }
    const defs = [
        ...KNOWN_PLATFORMS,
        ...userPlatforms
            .filter((n) => n !== "기타" && !KNOWN_PLATFORMS.some((k) => k.name === n))
            .map((n) => ({ name: n, re: new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })),
    ];
    const head = text.split("\n").slice(0, 3).join("\n");
    const bracketed = head.match(/[\[【]\s*([^\]】]+?)\s*[\]】]/g) ?? [];
    for (const b of bracketed) {
        const hit = defs.find((p) => p.re.test(b));
        if (hit)
            return hit.name;
    }
    let first = null;
    for (const p of defs) {
        const m = text.match(p.re);
        if (m && (first === null || (m.index ?? 0) < first.index))
            first = { name: p.name, index: m.index ?? 0 };
    }
    return first?.name ?? null;
}
function isGreeting(name) {
    return /안녕|입니다|축하|안내/.test(name);
}
/** A bracket such as [부천] or [서울/마포구], not a platform name like [서울오빠]. */
function isPlaceToken(raw) {
    const name = raw.trim();
    if (!name || name.length > 20)
        return false;
    if (KNOWN_PLATFORMS.some((p) => p.re.test(name)))
        return false;
    if (new RegExp(`^(?:${REGION_WORDS})(?:\\s*[\\/·]\\s*|\\s+)?\\S{0,12}$`).test(name))
        return true;
    if (/[가-힣]{2,}(?:시|군|구)$/.test(name) && name.length <= 10)
        return true;
    return /^(?:부천|수원|성남|고양|용인|창원|청주|전주|천안|제주|강남|홍대|잠실|송파|마포|용산|성수|연남|해운대|서면|일산|분당|판교|송도|청라|김포|평택|화성|안양|안산|의정부|남양주|하남|광명|군포|시흥|파주|이천|오산|양주|구리|포천|동탄|부평|인천|대구|대전|광주|부산|울산)$/.test(name);
}
/** [부천] 플랫디 → 플랫디 (부천). A district like [서울/마포구] stays off the shop name. */
function formatShopName(raw) {
    let name = raw.replace(/\s+/g, " ").trim().replace(/^(?:\[\d{3,}\]\s*)+/, "");
    const nested = name.match(/^[\[【]\s*([^\]】]{1,20})\s*[\]】]\s*(.+)$/u);
    if (nested && isPlaceToken(nested[1])) {
        const shop = nested[2].replace(/\s*(?:크리에이터|체험단|캠페인|리뷰어|기자단|모집|선정|당첨).*$/u, "").trim();
        const place = nested[1].trim();
        if (shop && !isGreeting(shop)) {
            if (place.length <= 8 && !/[\/·\s]/.test(place) && !shop.includes(place))
                return `${shop} (${place})`;
            return shop;
        }
    }
    return name.replace(/\s*(?:크리에이터|체험단|캠페인|리뷰어|기자단|모집|선정|당첨)\s*$/u, "").trim();
}
function findBusinessInText(text) {
    const quoted = /['‘"“「『《]([^'’"”」』》\n]{2,40})['’"”」』》]/gu;
    for (const m of text.matchAll(quoted)) {
        const after = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 20);
        if (/캠페인|체험단|선정|당첨|리뷰|기자단/.test(after))
            return m[1].trim();
    }
    const selected = text.match(/[\[【]\s*([^\]】]{1,20})\s*[\]】]\s*([^\[\]【】\n'"‘’“”]{1,40}?)\s*(?:크리에이터|리뷰어|기자단|체험단)(?:로|으로)?\s*선정/u);
    if (selected && isPlaceToken(selected[1]) && !isGreeting(selected[2]))
        return formatShopName(`[${selected[1]}] ${selected[2]}`);
    const regionBracket = new RegExp(`[\\[【]\\s*((?:${REGION_WORDS})[^\\]】\\n]{0,20})[\\]】]\\s*([^\\n\\[\\]【】'"‘’“”]{2,40}?)\\s*(?:체험단|캠페인|리뷰어|기자단|모집|에\\s|이\\s|가\\s|선정|당첨|\\n|$)`, "u");
    const rb = text.match(regionBracket);
    if (rb && isPlaceToken(rb[1]) && rb[2].trim().length >= 2 && !isGreeting(rb[2]))
        return formatShopName(rb[2]);
    for (const line of text.split("\n")) {
        const heading = line.match(/^[ \t>*#\-]*[\[【]\s*([^\]】]{1,20})\s*[\]】]\s*([가-힣A-Za-z0-9*][^\n]{0,40}?)\s*$/u);
        if (heading && isPlaceToken(heading[1])) {
            const shop = heading[2].replace(/[*_`]/g, "").trim();
            if (shop && !isGreeting(shop) && !/선정되|신청/.test(shop))
                return formatShopName(`[${heading[1]}] ${shop}`);
        }
        const stacked = shopFromBracketLine(line);
        if (stacked)
            return stacked;
    }
    const before = text.match(/([^\s\[\]【】!?.,]+(?:\s[^\s\[\]【】!?.,]+){0,2})\s*(?:체험단|캠페인)(?:에|이|의)?\s*(?:최종\s*)?(?:선정|당첨)/u);
    if (before) {
        const stop = /^(?:축하|안녕|고객|회원|블로거|님|신청|하신|참여|이번|해당|저희|귀하|최종|[가-힣]+님)/;
        const words = before[1].split(" ").filter((w) => !stop.test(w) && !KNOWN_PLATFORMS.some((p) => p.re.test(w)));
        const name = words.join(" ").trim();
        if (name.length >= 2 && !isGreeting(name))
            return name;
    }
    return null;
}
function findAddress(lines) {
    const re = new RegExp(`((?:${REGION_WORDS})[가-힣]*\\s+[가-힣]+(?:시|군|구)(?:\\s+[가-힣]+(?:구|군))?\\s+[^\\n]{2,60})`, "u");
    for (const line of lines) {
        const m = line.match(re);
        if (m && /\d|로|길|동|읍|면/.test(m[1]))
            return stripUrls(m[1]).trim();
    }
    return null;
}
// ---------------------------------------------------------------------------
// Phone numbers and visit hours
const PHONE_RE = /(?<!\d)(?:01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}|0\d{1,2}[-\s.]\d{3,4}[-\s.]\d{4})(?!\d)/g;
function formatPhone(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 11)
        return null;
    if (digits.startsWith("02") && digits.length === 9)
        return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    if (digits.startsWith("02") && digits.length === 10)
        return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    if (digits.length === 11)
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    if (digits.length === 10)
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    return null;
}
function firstPhone(text) {
    PHONE_RE.lastIndex = 0;
    const match = PHONE_RE.exec(text);
    return match ? formatPhone(match[0]) : null;
}
function firstUrl(text) {
    const match = text.match(/https?:\/\/[^\s<>"'()[\]]+/i);
    if (!match)
        return null;
    return match[0].replace(/[),.;]+$/, "").replace(/[가-힣]+$/u, "");
}
function contactFromLine(line) {
    const phone = firstPhone(line);
    const url = firstUrl(line);
    if (phone)
        return phone;
    return url;
}
function findContact(text) {
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (!/예약\s*(?:전화|번호|문의)|문의\s*(?:전화|번호)|연락할\s*번호|톡톡/.test(lines[i]))
            continue;
        if (/고객센터|사업자|기재/.test(lines[i]))
            continue;
        const contact = contactFromLine(lines[i]) || contactFromLine(lines[i + 1] ?? "") || contactFromLine(lines[i + 2] ?? "");
        if (contact)
            return contact;
    }
    return findPhone(text);
}
function findPhone(text) {
    const lines = text.split("\n");
    const ranked = lines
        .map((line, index) => ({
        line,
        index,
        score: /고객센터|사업자|대표\s*:|기재/.test(line) ? -1 : /예약/.test(line) ? 2 : /문의|전화|연락|휴대폰|핸드폰/.test(line) ? 1 : 0,
    }))
        .filter((item) => item.score >= 0)
        .sort((a, b) => b.score - a.score || a.index - b.index);
    for (const item of ranked) {
        const phone = firstPhone(item.line);
        if (phone)
            return phone;
    }
    return null;
}
function clockHHMM(hour, minute, ampm) {
    if (hour === 24 && minute === 0)
        return "23:59";
    if (minute < 0 || minute > 59 || hour < 0 || hour > 23)
        return null;
    if (ampm && (hour < 1 || hour > 12))
        return null;
    let h = hour;
    if (ampm === "pm" && h < 12)
        h += 12;
    if (ampm === "am" && h === 12)
        h = 0;
    return `${pad(h)}:${pad(minute)}`;
}
function findClockTimes(text) {
    const re = /(?:(오전|오후)\s*)?(?<!\d)(\d{1,2})\s*(?::\s*(\d{2})(?!\d)|시(?:\s*(\d{1,2})\s*분)?)/g;
    const tokens = [];
    for (const match of text.matchAll(re)) {
        const ampm = match[1] === "오전" ? "am" : match[1] === "오후" ? "pm" : null;
        const hour = Number(match[2]);
        const minute = Number(match[3] ?? match[4] ?? 0);
        const hhmm = clockHHMM(hour, minute, ampm);
        if (!hhmm)
            continue;
        const start = match.index ?? 0;
        tokens.push({
            hhmm,
            hour,
            minute,
            ampm,
            style: match[3] != null ? "colon" : "hour",
            start,
            end: start + match[0].length,
        });
    }
    return tokens;
}
function rangeOnLine(line) {
    const tokens = findClockTimes(line);
    for (let i = 0; i < tokens.length - 1; i++) {
        const a = tokens[i];
        const b = tokens[i + 1];
        const gap = line.slice(a.end, b.start);
        if (!/^\s*(?:[~∼〜\-–—]|부터)\s*$/.test(gap))
            continue;
        let endHour = b.hour;
        let endAmpm = b.ampm;
        const startHour = Number(a.hhmm.slice(0, 2));
        if (!a.ampm && !b.ampm && b.style === "hour" && b.minute === 0 && b.hour < 12 && b.hour < startHour) {
            endHour = b.hour + 12;
            endAmpm = null;
        }
        const end = clockHHMM(endHour, b.minute, endAmpm);
        if (!end)
            continue;
        return { start: a.hhmm, end };
    }
    return null;
}
function findTimeRange(text) {
    const lines = text.split("\n");
    const ranked = lines
        .map((line, index) => ({
        line,
        index,
        score: /방문\s*가능\s*시간|방문\s*시간|체험\s*시간|운영\s*시간|영업\s*시간|이용\s*시간/.test(line) ? 2 : /상담\s*시간|점심\s*시간/.test(line) ? 0 : /시간|방문|운영|영업/.test(line) ? 1 : 0,
    }))
        .sort((a, b) => b.score - a.score || a.index - b.index);
    for (const item of ranked) {
        const found = rangeOnLine(item.line);
        if (found)
            return found;
    }
    return null;
}
const STEP_RE = /^\d{1,2}[.)]\s+\S/;
function trimBlock(lines) {
    let start = 0;
    let end = lines.length;
    while (start < end && !lines[start])
        start++;
    while (end > start && !lines[end - 1])
        end--;
    return lines.slice(start, end).join("\n").slice(0, 8000);
}
function headingName(line) {
    const stripped = line
        .trim()
        .replace(/^[\s■□※★☆•·*▶►▷▸\-–—<【\[(#]+/u, "")
        .replace(/[>】\]]+\s*$/u, "")
        .trim();
    if (/^(?:(?:캠페인|리뷰어)\s*)?미션(?:\s*[(（][^)）]{0,12}[)）])?\s*$/.test(stripped))
        return "mission";
    if (/^(?:리뷰어\s*)?미션(?:\s|$|[:：])/.test(stripped))
        return "mission";
    if (/^리뷰\s*작성\s*안내/.test(stripped))
        return "review";
    if (/^필독/.test(stripped))
        return "must";
    return null;
}
function cutFooter(text) {
    return text.split(/이용약관|사업자\s*등록|Copyright|모바일\s*버전|개인정보보호정책/i)[0].trim();
}
function isFooter(line) {
    return /이용약관|사업자\s*등록|Copyright|모바일\s*버전|개인정보보호정책/i.test(line);
}
function squash(value) {
    return value.replace(/\s+/g, "").replace(/[^\p{L}\p{N}]+/gu, "");
}
function uniqueChunks(chunks) {
    const kept = [];
    const covers = (longer, shorter) => {
        const host = squash(longer);
        const guest = squash(shorter);
        if (!host || !guest)
            return false;
        if (host.includes(guest))
            return true;
        if (guest.length < 40)
            return false;
        const slices = guest.match(/.{24}/g) ?? [];
        if (slices.length < 2)
            return false;
        return slices.filter((part) => host.includes(part)).length / slices.length >= 0.7;
    };
    for (const chunk of chunks.map((item) => item.trim()).filter(Boolean)) {
        if (kept.some((item) => covers(item, chunk)))
            continue;
        for (let i = kept.length - 1; i >= 0; i--) {
            if (covers(chunk, kept[i]))
                kept.splice(i, 1);
        }
        kept.push(chunk);
    }
    return cutFooter(kept.join("\n\n")).slice(0, 8000);
}
function groupSteps(lines) {
    const groups = [];
    let current = [];
    const flush = () => {
        if (current.length >= 2)
            groups.push({ from: current[0], to: current[current.length - 1] });
        current = [];
    };
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^(\d{1,2})[.)]\s+\S/);
        if (!match)
            continue;
        const n = Number(match[1]);
        const prevIndex = current[current.length - 1];
        const prevN = prevIndex == null ? 0 : Number(lines[prevIndex].match(/^(\d+)/)?.[1] ?? 0);
        if (current.length && (n === 1 || n < prevN || i - prevIndex > 4))
            flush();
        current.push(i);
    }
    flush();
    return groups;
}
/** 미션, 리뷰작성안내, 필독, 예약 조율, or numbered instructions, kept as written. */
function extractMission(rawLines) {
    const trimmed = rawLines.map((line) => line.trim());
    const indexes = new Set();
    const chunks = [];
    for (let i = 0; i < trimmed.length; i++) {
        if (!/예약\s*조율/.test(trimmed[i]))
            continue;
        const block = [trimmed[i]];
        indexes.add(i);
        for (let j = i + 1; j < trimmed.length; j++) {
            const line = trimmed[j];
            if (!line) {
                const next = trimmed.slice(j + 1).find(Boolean);
                if (!next || headingName(next) || (matchLabel(cleanLine(next)) && !STEP_RE.test(next)))
                    break;
                block.push(line);
                indexes.add(j);
                continue;
            }
            if (headingName(line) || isFooter(line))
                break;
            const labeled = matchLabel(cleanLine(line));
            if (labeled && labeled.field !== "phone" && !STEP_RE.test(line) && !/^https?:\/\//i.test(line))
                break;
            if (/^[※★☆]/.test(line) || /예약|문의|페이백|환급|톡톡/.test(line) || labeled?.field === "phone") {
                block.push(line);
                indexes.add(j);
                continue;
            }
            break;
        }
        chunks.push(trimBlock(block));
    }
    for (let i = 0; i < trimmed.length; i++) {
        if (!headingName(trimmed[i]) || indexes.has(i))
            continue;
        const block = [trimmed[i]];
        indexes.add(i);
        for (let j = i + 1; j < trimmed.length; j++) {
            const line = trimmed[j];
            if (!line) {
                const next = trimmed.slice(j + 1).find(Boolean);
                if (!next || /^https?:\/\//i.test(next) || headingName(next) || isFooter(next))
                    break;
            }
            else if (headingName(line) || isFooter(line)) {
                break;
            }
            block.push(line);
            indexes.add(j);
        }
        chunks.push(trimBlock(block));
    }
    for (const group of groupSteps(trimmed)) {
        if (Array.from({ length: group.to - group.from + 1 }, (_, offset) => group.from + offset).every((index) => indexes.has(index))) {
            continue;
        }
        let to = group.to;
        for (let i = to + 1; i < trimmed.length && i <= group.to + 8; i++) {
            const line = trimmed[i];
            if (!line)
                continue;
            if (headingName(line) || isFooter(line) || STEP_RE.test(line))
                break;
            if (/^[-•※★]/.test(line) || /^https?:\/\//i.test(line) || /당일\s*예약|절대\s*불가|카카오|인스타|지도/.test(line)) {
                to = i;
                continue;
            }
            break;
        }
        chunks.push(trimBlock(trimmed.slice(group.from, to + 1)));
        for (let i = group.from; i <= to; i++)
            indexes.add(i);
    }
    const text = uniqueChunks(chunks);
    if (!text)
        return null;
    return { text, indexes: [...indexes] };
}
const PAGE_MARKERS = ["제공내역", "유의사항", "리뷰어 미션", "방문가능시간", "방문 가능 시간", "필수 키워드", "필독사항", "리뷰작성안내", "리뷰 작성 안내", "예약 문의"];
function decodeEntities(text) {
    return text
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">");
}
/** Turn fetched HTML or flattened reader text into lines the field parser can see. */
function tidyPageText(raw) {
    let text = decodeEntities(raw).replace(/\r\n?/g, "\n");
    text = text.replace(/(이용약관|사업자\s*등록번호|사업자\s*등록|Copyright|모바일\s*버전|개인정보보호정책)/gi, "\n$1");
    text = text.split(/추천\s*캠페인\s*둘러보기|함께\s*하면\s*좋아요|관련\s*리뷰|맞춤\s*캠페인|캠페인\s*선정자만\s*확인|주목할\s*만한\s*인기\s*캠페인|오늘\s*새로\s*나온\s*캠페인|다른\s*캠페인\s*보기/)[0];
    text = text.replace(/키워드\s*작성\s*방법[\s\S]*?(?=필수\s*키워드\s*[:：])/g, "");
    if (/<\/?[a-z!]/i.test(text)) {
        text = text
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/(p|div|tr|li|h\d|table|section)>/gi, "\n")
            .replace(/<[^>]+>/g, " ");
    }
    text = text
        .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, label, url) => {
        const name = label.trim();
        if (!name || name === url || name.includes(url))
            return url;
        return `${name} ${url}`;
    });
    for (const word of PAGE_MARKERS) {
        const pattern = word.replace(/\s+/g, "\\s*");
        text = text.replace(new RegExp(`(?<![가-힣A-Za-z0-9])(${pattern})(?:\\s*[:：]|\\s*\\d{1,2}(?=\\s|$)|(?=\\s*(?:\\n|$))|(?=\\.)|\\s+(?!환불|를|는|와|과|이|을|에|의|도))`, "g"), (_full, label) => `\n${label}: `);
    }
    text = text.replace(/(리뷰\s*등록\s*기간|리뷰\s*마감\s*기한|리뷰\s*기간|방문\s*가능\s*시간|방문\s*시간|예약\s*번호|예약\s*전화|캠페인\s*명)(?=\s*\d)/g, "$1: ");
    text = text
        .replace(/([^\d\n])(\d{1,2})\.(?=[^\s\d])/g, "$1\n$2. ")
        .replace(/([^\n])(\d{1,2})\.\s+(?=\S)/g, "$1\n$2. ")
        .replace(/[ \t]*([※★])\s*/g, "\n$1 ")
        .replace(/(?<![시\d])[ \t]+-\s+/g, "\n- ");
    text = text.split(/\n(?:이용약관|사업자\s*등록|Copyright|개인정보보호정책|개인정보처리방침)/i)[0] ?? text;
    return text
        .replace(/[ \t]+\n/g, "\n")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
function pageIsUseful(text) {
    return /제공\s*내역|리뷰어\s*미션|캠페인\s*미션|필수\s*키워드|방문\s*(?:가능\s*)?시간|필독|리뷰\s*작성\s*안내|캠페인\s*명|예약\s*번호|식사\s*체험|체험권|체험\s*시간|리뷰\s*(?:등록\s*)?기간|방문\s*위치/.test(text);
}
/** [서울 마포][클립] 바 페기스 → 바 페기스. Place brackets that are a single city stay in parentheses. */
function shopFromBracketLine(line) {
    const stripped = line.replace(/^[\s>*#\-]+/u, "").replace(/[*_`]/g, "").trim();
    const brackets = [];
    let rest = stripped;
    for (let guard = 0; guard < 4; guard++) {
        const match = rest.match(/^\[([^\]\n]{1,20})\]\s*(.*)$/u);
        if (!match)
            break;
        brackets.push(match[1].trim());
        rest = match[2].trim();
    }
    if (brackets.length === 0 || !brackets.some((token) => isPlaceToken(token)))
        return null;
    const shop = rest.replace(/\s*(?:\d+\s*차|크리에이터|체험단|캠페인|리뷰어|기자단|모집|선정|당첨|배너|섹션|이미지).*$/u, "").trim();
    if (!shop || shop.length > 40 || isGreeting(shop) || /신청|캐러셀/.test(shop))
        return null;
    const place = brackets.find((token) => isPlaceToken(token) && token.length <= 8 && !/[\s/·]/.test(token));
    return place && !shop.includes(place) ? `${shop} (${place})` : shop;
}
function isPointer(value) {
    const compact = value.replace(/\s/g, "");
    return compact.length <= 24 && /링크|참조|홈페이지/.test(compact);
}
function isWeakOffer(value) {
    const compact = value.trim();
    return !compact || isPointer(compact) || /^\d{1,3}$/.test(compact);
}
function keywordScore(value) {
    const clipped = clipKeywordSource(value).trim();
    if (!clipped || /넣어\s*주|작성법|예시|해시태그로/.test(clipped))
        return 0;
    const parts = clipped.split(/[,，]/).map((part) => part.trim()).filter(Boolean);
    if (parts.length === 0 || parts.some((part) => /넣어|작성|제목|본문|이상/.test(part)))
        return 0;
    if (parts.every((part) => part.length <= 30))
        return parts.length + 2;
    return 0;
}
function clipKeywordSource(raw) {
    return raw.split(/\s*위\s*키워드|\s*제목\s*에는|\s*본문\s*에는/)[0] ?? raw;
}
function joinMission(current, extra) {
    const base = (current ?? "").trim();
    const incoming = (extra ?? "").trim();
    if (!incoming)
        return base.slice(0, 8000);
    if (!base)
        return incoming.slice(0, 8000);
    const host = squash(base);
    const fresh = incoming
        .split("\n")
        .filter((line) => {
        const guest = squash(line);
        return guest.length < 18 || !host.includes(guest);
    })
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    return uniqueChunks([base, fresh]);
}
function pageRank(url) {
    if (isNoiseLink(url))
        return 0;
    if (isTalkLink(url))
        return 1;
    if (/\/user\/visit\//i.test(url))
        return 2;
    if (isCampaignLink(url))
        return 3;
    return 2;
}
function pageContact(text, phone) {
    if (/ringble\.co\.kr|nid\.naver|nidlogin/i.test(phone))
        return false;
    if (/^https?:\/\//i.test(phone))
        return /예약|문의|톡톡/.test(text);
    const digits = phone.replace(/\D/g, "");
    if (/^1[568]\d{6,8}$/.test(digits))
        return false;
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const window = lines.slice(Math.max(0, i - 2), i + 3).join(" ");
        const compact = window.replace(/\D/g, "");
        if (!window.includes(phone) && !(digits.length >= 9 && compact.includes(digits)))
            continue;
        if (/고객센터|사업자|대표\s*:|상담\s*시간|기재해/.test(window))
            return false;
        if (/예약|연락|전화|문의/.test(window))
            return true;
    }
    return false;
}
function composeTimeNote(text, labeled) {
    const closed = text
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.length > 0 && line.length < 80 && /휴무|공휴일\s*방문\s*불가/.test(line));
    if (labeled && /평일|주말|공휴일|휴무|에만|월\s*~/.test(labeled)) {
        const base = labeled.replace(/\s+/g, " ").trim();
        if (closed && !base.includes(closed) && !/휴무|공휴일/.test(base))
            return `${base} / ${closed}`.slice(0, 300);
        return base.slice(0, 300);
    }
    const source = `${labeled ?? ""}\n${text}`;
    const parts = [];
    if (/모든\s*요일/.test(source))
        parts.push("모든 요일");
    if (/사전\s*조율/.test(source))
        parts.push("사전 조율");
    if (/당일\s*예약/.test(source) && /불가/.test(source))
        parts.push("당일예약 불가");
    if (parts.length >= 2)
        return parts.join(", ").slice(0, 300);
    if (labeled && /가능|불가|조율|휴무/.test(labeled))
        return labeled.replace(/\s+/g, " ").trim().slice(0, 300);
    return null;
}
// ---------------------------------------------------------------------------
function parseWinMessage(input, options) {
    const { today } = options;
    const userPlatforms = options.platforms ?? [];
    const text = normalize(input);
    const rawLines = text.split("\n");
    const lines = rawLines.map(cleanLine);
    const urls = Array.from(text.matchAll(/https?:\/\/[^\s<>"'()\[\]]+/gi), (m) => m[0].replace(/[.,!?)\]]+$/, ""));
    const labeled = new Map();
    const usedLines = new Set();
    const blockedFromPlatformScan = new Set();
    const missionBlock = extractMission(rawLines);
    const missionIndexes = new Set(missionBlock?.indexes ?? []);
    const keptInsideMission = new Set(["keywords", "phone", "address", "deadline", "visitPeriod", "visitTime", "visitDate"]);
    let phoneFromReservation = false;
    let bestKeyword = "";
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line)
            continue;
        if (missionIndexes.has(i)) {
            const peek = matchLabel(line);
            if (!peek || !keptInsideMission.has(peek.field))
                continue;
        }
        const hit = matchLabel(line);
        if (!hit)
            continue;
        usedLines.add(i);
        let value = hit.value;
        const extra = [];
        if (MULTILINE_FIELDS.has(hit.field) || value === "") {
            for (let j = i + 1; j < lines.length; j++) {
                if (missionIndexes.has(j) && hit.field !== "keywords" && hit.field !== "guide")
                    break;
                const next = lines[j];
                if (!next) {
                    if (value === "" && extra.length === 0)
                        continue;
                    break;
                }
                if (matchLabel(next) || /^https?:\/\//i.test(next))
                    break;
                const offerStarted = hit.field === "offer" && (value !== "" || extra.length > 0);
                if (hit.field !== "offer" && KEY_VALUE_RE.test(next))
                    break;
                if (offerStarted && (KEY_VALUE_RE.test(next) || /초과\s*비용|본인\s*부담|보상이\s*어렵|타쿠폰|유의사항/.test(next)))
                    break;
                if (!MULTILINE_FIELDS.has(hit.field) && (value !== "" || extra.length))
                    break;
                extra.push(next);
                usedLines.add(j);
                if (hit.field !== "guide")
                    blockedFromPlatformScan.add(j);
                if (!MULTILINE_FIELDS.has(hit.field))
                    break;
            }
        }
        if (extra.length)
            value = [value, ...extra].filter(Boolean).join("\n");
        if (hit.field === "keywords" || hit.field === "guide")
            blockedFromPlatformScan.add(i);
        if (!value || isMenuWord(value))
            continue;
        if (hit.field === "address" && !/(?:로|길|동|읍|면|구|시|\d)/.test(value))
            continue;
        if (hit.field === "phone") {
            const reservation = /예약/.test(line);
            const prev = labeled.get("phone");
            if (prev === undefined || (reservation && !phoneFromReservation)) {
                labeled.set("phone", value);
                phoneFromReservation = reservation;
            }
            continue;
        }
        if (hit.field === "keywords") {
            if (keywordScore(value) > keywordScore(bestKeyword)) {
                bestKeyword = value;
                labeled.set("keywords", value);
            }
            continue;
        }
        const prev = labeled.get(hit.field);
        if (prev === undefined)
            labeled.set(hit.field, value);
        else if (hit.field === "guide")
            labeled.set(hit.field, `${prev}\n${value}`);
    }
    const fields = {};
    const set = (key, value) => {
        if (value === null || value === undefined || value === "")
            return;
        if (fields[key] !== undefined)
            return;
        fields[key] = value;
    };
    // Platform
    const scanText = lines.filter((_, i) => !blockedFromPlatformScan.has(i)).join("\n");
    const labeledPlatform = labeled.get("platform");
    set("platform", labeledPlatform ? labeledPlatform.slice(0, 40) : detectPlatform(scanText, urls, userPlatforms));
    const platformNames = [...KNOWN_PLATFORMS.map((p) => p.name), ...userPlatforms];
    // Business name
    const labeledBusiness = labeled.get("business");
    const regionFromBracket = (labeledBusiness ?? text).match(new RegExp(`[\\[【]\\s*((?:${REGION_WORDS})[^\\]】\\n]*)[\\]】]`, "u"))?.[1];
    const business = labeledBusiness ? stripUrls(labeledBusiness) : findBusinessInText(text);
    if (business) {
        const named = formatShopName(cleanBusinessName(business, platformNames));
        if (named && !isGreeting(named))
            set("business_name", named.slice(0, 120));
    }
    // Offer & amount
    const offer = labeled.get("offer");
    if (offer)
        set("offer", stripUrls(offer));
    const labeledAmount = labeled.get("amount");
    let amount = null;
    if (labeledAmount)
        amount = pickAmount(labeledAmount);
    if (amount === null && offer)
        amount = pickAmount(offer);
    if (amount === null) {
        const offerish = lines.filter((l) => /상당|제공|식사권|체험권|이용권|숙박권|상품권|바우처|금액|정가|세트|코스/.test(l) && !PENALTY_RE.test(l));
        amount = pickAmount(offerish.join("\n"));
        if (amount !== null && !offer) {
            const line = offerish.find((l) => findAmounts(l).length > 0 && !matchLabel(l));
            if (line)
                set("offer", line.replace(/\*+/g, "").trim());
        }
    }
    if (amount === null)
        amount = pickAmount(lines.filter((l) => !PENALTY_RE.test(l)).join("\n"));
    set("amount", amount);
    // Address / region
    const address = labeled.get("address");
    set("region", address ? stripUrls(address) : (findAddress(lines) ?? regionFromBracket?.trim() ?? null));
    // Dates from labeled lines
    const visitPeriod = labeled.get("visitPeriod");
    if (visitPeriod) {
        const { ranges, singles } = findRanges(visitPeriod, today);
        if (ranges[0]) {
            set("visit_start", ranges[0].start);
            set("visit_end", ranges[0].end);
        }
        else if (singles[0]) {
            const untilOnly = /까지/.test(visitPeriod);
            if (!untilOnly)
                set("visit_start", singles[0].iso);
            set("visit_end", singles[singles.length - 1].iso);
        }
    }
    const visitDate = labeled.get("visitDate");
    if (visitDate)
        set("visit_date", findDates(visitDate, today)[0]?.iso);
    const deadline = labeled.get("deadline");
    if (deadline)
        set("deadline", findDates(deadline, today).at(-1)?.iso);
    const won = labeled.get("won");
    if (won)
        set("won_date", findDates(won, today)[0]?.iso);
    // Dates from free text
    const scheduleLines = scheduleDateLines(lines, today);
    const unlabeledDates = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || scheduleLines.has(i))
            continue;
        const hit = matchLabel(line);
        if (hit && DATE_FIELDS.has(hit.field))
            continue;
        const { ranges, singles } = findRanges(line, today);
        if (ranges.length === 0 && singles.length === 0)
            continue;
        const isDeadline = /(?:리뷰|후기|포스팅|콘텐츠|컨텐츠|원고|게시물|결과물|업로드).{0,20}(?:마감|등록|작성|기간|기한|까지|업로드)|마감/.test(line);
        const isVisit = /방문|체험|이용|예약|체크인|사용|일정/.test(line);
        const allDates = [...ranges.map((r) => r.end), ...singles.map((s) => s.iso)].sort();
        if (isDeadline && !(isVisit && /방문.{0,10}(?:기간|가능)/.test(line))) {
            set("deadline", allDates.at(-1));
        }
        else if (isVisit) {
            if (ranges[0]) {
                set("visit_start", ranges[0].start);
                set("visit_end", ranges[0].end);
            }
            else if (/예약|방문\s*(?:일|예정|확정)|체크인/.test(line) && !/까지/.test(line)) {
                set("visit_date", singles[0].iso);
            }
            else {
                set("visit_end", singles.at(-1)?.iso);
            }
        }
        else if (/모집|신청\s*기간|캠페인\s*종료|크리에이터\s*선정/.test(line)) {
            // A campaign schedule is not a visit window.
        }
        else if (/당첨|선정|발표/.test(line) && singles[0]) {
            set("won_date", singles[0].iso);
        }
        else {
            unlabeledDates.push({ line, ranges, singles });
        }
    }
    // Remaining unexplained dates: the first range is usually the visit window, the latest date the deadline.
    if (unlabeledDates.length) {
        const firstRange = unlabeledDates.flatMap((d) => d.ranges)[0];
        if (firstRange && fields.visit_end === undefined && fields.visit_date === undefined) {
            set("visit_start", firstRange.start);
            set("visit_end", firstRange.end);
        }
        if (fields.deadline === undefined) {
            const all = unlabeledDates.flatMap((d) => [...d.ranges.map((r) => r.end), ...d.singles.map((s) => s.iso)]).sort();
            const last = all.at(-1);
            if (last && last !== fields.visit_end)
                set("deadline", last);
        }
    }
    const stackedReview = stackedReviewDeadline(lines, today);
    if (stackedReview)
        fields.deadline = stackedReview;
    // Keywords
    const kw = labeled.get("keywords");
    if (kw)
        set("keywords", normalizeKeywords(clipKeywordSource(kw)));
    else {
        const tagLine = lines.find((l) => (l.match(/#[^#\s,]+/g) ?? []).length >= 2);
        if (tagLine)
            set("keywords", normalizeKeywords(tagLine));
    }
    if (missionBlock?.text) {
        set("mission", missionBlock.text);
        for (const index of missionBlock.indexes)
            usedLines.add(index);
    }
    const labeledTime = labeled.get("visitTime");
    const timeRange = (labeledTime && findTimeRange(labeledTime)) || findTimeRange(text);
    if (timeRange) {
        set("visit_time_start", timeRange.start);
        set("visit_time_end", timeRange.end);
    }
    const timeNote = composeTimeNote(text, labeledTime);
    if (timeNote)
        set("visit_time_note", timeNote);
    const labeledPhone = labeled.get("phone");
    set("phone", (labeledPhone && contactFromLine(labeledPhone)) || findContact(text));
    // Guide: labeled guide plus notable unlabeled notes
    const guideParts = [];
    const g = labeled.get("guide");
    if (g)
        guideParts.push(stripUrls(g));
    rawLines.forEach((raw, i) => {
        if (usedLines.has(i))
            return;
        const line = lines[i];
        if (!line)
            return;
        if (/^\s*※/.test(raw) || /반드시|필수|꼭\s|금지|유의/.test(line)) {
            if (!guideParts.some((p) => p.includes(line)))
                guideParts.push(stripUrls(line));
        }
    });
    if (guideParts.length)
        set("guide", guideParts.filter(Boolean).join("\n").slice(0, 5000));
    // Category
    const cat = labeled.get("category");
    const category = cat
        ? mapCategory(cat)
        : inferCategory([fields.business_name, fields.offer, text].filter(Boolean).join("\n"));
    set("category", category);
    // Link: the campaign homepage outranks a visit card, a map, or a short link.
    const labeledLink = labeled.get("link")?.match(/https?:\/\/\S+/)?.[0];
    const bestUrl = [...urls].sort((a, b) => pageRank(b) - pageRank(a))[0];
    const chosenUrl = labeledLink && bestUrl && pageRank(labeledLink) >= pageRank(bestUrl) ? labeledLink : (bestUrl ?? labeledLink);
    set("campaign_url", chosenUrl);
    if (fields.visit_date)
        set("status", "방문 예정");
    const pages = [...(options.pages ?? [])].sort((a, b) => pageRank(a.url) - pageRank(b.url));
    for (const page of pages) {
        if (pageRank(page.url) <= 0)
            continue;
        const facts = factsFromPage(page.text, today);
        const prefer = pageRank(page.url) >= 2;
        if (facts.business_name && !isGreeting(facts.business_name) && (prefer || !fields.business_name || isGreeting(String(fields.business_name)))) {
            fields.business_name = facts.business_name;
        }
        if (facts.offer && !isWeakOffer(facts.offer) && (prefer || !fields.offer || isWeakOffer(String(fields.offer ?? "")))) {
            fields.offer = facts.offer;
            if (facts.amount != null)
                fields.amount = facts.amount;
        }
        if (facts.keywords && (prefer || !fields.keywords))
            fields.keywords = facts.keywords;
        if (facts.phone && (prefer || !fields.phone))
            fields.phone = facts.phone;
        if (facts.amount != null && (prefer || fields.amount == null))
            fields.amount = facts.amount;
        if (facts.visit_time_start && facts.visit_time_end && (prefer || !fields.visit_time_start)) {
            fields.visit_time_start = facts.visit_time_start;
            fields.visit_time_end = facts.visit_time_end;
        }
        if (facts.visit_time_note && (prefer || !fields.visit_time_note))
            fields.visit_time_note = facts.visit_time_note;
        if (facts.deadline && (prefer || !fields.deadline))
            fields.deadline = facts.deadline;
        if (facts.region && /로|길|\d/.test(facts.region) && (prefer || !fields.region || !/로|길|\d/.test(String(fields.region)))) {
            fields.region = facts.region;
        }
        if (facts.mission)
            fields.mission = joinMission(fields.mission, facts.mission);
        if (!fields.platform && facts.platform)
            fields.platform = facts.platform;
        if (facts.category && (prefer || !fields.category))
            fields.category = facts.category;
    }
    const combinedNote = composeTimeNote([text, ...pages.map((page) => page.text)].join("\n"), labeledTime);
    if (combinedNote)
        fields.visit_time_note = combinedNote;
    const filled = Object.keys(fields).filter((key) => {
        const value = fields[key];
        return value !== undefined && value !== "";
    });
    return { fields, filled };
}
function factsFromPage(text, today) {
    const tidy = tidyPageText(text);
    if (!pageIsUseful(tidy))
        return {};
    const parsed = parseWinMessage(tidy, { today });
    const facts = {};
    if (parsed.fields.offer && !isWeakOffer(parsed.fields.offer))
        facts.offer = parsed.fields.offer;
    if (parsed.fields.amount != null)
        facts.amount = parsed.fields.amount;
    else if (facts.offer) {
        const amount = pickAmount(facts.offer);
        if (amount != null)
            facts.amount = amount;
    }
    if (parsed.fields.keywords)
        facts.keywords = parsed.fields.keywords;
    if (parsed.fields.mission)
        facts.mission = parsed.fields.mission;
    if (parsed.fields.phone && pageContact(tidy, parsed.fields.phone))
        facts.phone = parsed.fields.phone;
    if (parsed.fields.visit_time_start && parsed.fields.visit_time_end) {
        facts.visit_time_start = parsed.fields.visit_time_start;
        facts.visit_time_end = parsed.fields.visit_time_end;
    }
    if (parsed.fields.visit_time_note)
        facts.visit_time_note = parsed.fields.visit_time_note;
    if (parsed.fields.deadline)
        facts.deadline = parsed.fields.deadline;
    if (parsed.fields.business_name && !isGreeting(parsed.fields.business_name))
        facts.business_name = parsed.fields.business_name;
    if (parsed.fields.region)
        facts.region = parsed.fields.region;
    if (parsed.fields.platform)
        facts.platform = parsed.fields.platform;
    if (parsed.fields.category)
        facts.category = parsed.fields.category;
    return facts;
}

/* src/lib/fetch-pages.ts */
const NOISE_LINK = /bit\.ly|bitly\.com|tinyurl\.com|(?:^|\/\/|\.)goo\.gl|t\.co\/|han\.gl|vo\.la|naver\.me|kko\.to|map\.naver|map\.kakao|maps\.google|maps\.app\.goo|place\.map|google\.com\/maps|instagram\.com|facebook\.com|youtube\.com|youtu\.be|blog\.naver|pf\.kakao|open\.kakao/i;
const TALK_LINK = /talk\.naver\.com|nid\.naver\.com|nidlogin/i;
const CAMPAIGN_LINK = /campaign|detail\.php|\/detail\/|\/taste\/|\/cp\/|[?&](?:c|number|id|idx)=/i;
const PLATFORM_HOST = /revu\.net|dinnerqueen\.net|reviewnote\.co\.kr|mrblog\.net|seoulouba\.co\.kr|reviewplace\.co\.kr|ringble\.co\.kr|xn--939au0g4vj8sq|강남맛집\.net/i;
function messageUrls(text) {
    const found = Array.from(text.matchAll(/https?:\/\/[^\s<>"'()[\]]+/gi), (match) => match[0].replace(/[.,!?)\]]+$/, ""));
    return [...new Set(found)];
}
/** Instruction shorts, maps, and social profiles are not the campaign page. */
function isNoiseLink(url) {
    return NOISE_LINK.test(url);
}
function isTalkLink(url) {
    return TALK_LINK.test(url);
}
/** A campaign homepage, including platforms other than the built-in list. */
function isCampaignLink(url) {
    if (isNoiseLink(url) || isTalkLink(url))
        return false;
    if (PLATFORM_HOST.test(url) || CAMPAIGN_LINK.test(url))
        return true;
    try {
        const parsed = new URL(url);
        return parsed.pathname.length > 1 || parsed.search.length > 1;
    }
    catch {
        return false;
    }
}
/** Read the campaign page inside a win message. Short links and login-only talk links are skipped. */
async function loadLinkedPages(text) {
    const urls = messageUrls(text).filter((url) => !isNoiseLink(url));
    const pages = [];
    const failed = [];
    await Promise.all(urls.map(async (url) => {
        try {
            const body = await fetchReadable(url);
            if (isLoginWall(body)) {
                if (!isTalkLink(url))
                    failed.push(url);
                return;
            }
            pages.push({ url, text: body });
        }
        catch {
            failed.push(url);
        }
    }));
    return { pages, failed };
}
function isLoginWall(text) {
    if (/제공\s*내역|제공내역|리뷰어\s*미션|캠페인\s*미션|예약\s*번호|방문\s*가능\s*시간|필수\s*키워드|식사\s*체험|리뷰\s*등록\s*기간|리뷰\s*기간/.test(text)) {
        return false;
    }
    const compact = text.replace(/\s+/g, " ").slice(0, 5000);
    return /로그인|sign in|log in/i.test(compact) && /비밀번호|password/i.test(compact);
}
async function fetchReadable(url) {
    const targets = /^https?:\/\/r\.jina\.ai\//i.test(url) ? [url] : [url, `https://r.jina.ai/${url}`];
    let last = null;
    for (const target of targets) {
        try {
            return await fetchText(target);
        }
        catch (error) {
            last = error;
        }
    }
    throw last instanceof Error ? last : new Error("fetch failed");
}
async function fetchText(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
        const response = await fetch(url, { signal: ctrl.signal, credentials: "omit", redirect: "follow" });
        if (!response.ok)
            throw new Error(String(response.status));
        const text = await response.text();
        if (text.trim().length < 40)
            throw new Error("empty");
        return text;
    }
    finally {
        clearTimeout(timer);
    }
}

root.RN = {
  STATUSES: STATUSES,
  FLOW_STATUSES: FLOW_STATUSES,
  CATEGORIES: CATEGORIES,
  DEFAULT_PLATFORMS: DEFAULT_PLATFORMS,
  emptyCampaign: emptyCampaign,
  needsReview: needsReview,
  needsVisit: needsVisit,
  isReviewDone: isReviewDone,
  isSafeUrl: isSafeUrl,
  pad: pad,
  toISO: toISO,
  todayISO: todayISO,
  parseISO: parseISO,
  isValidISO: isValidISO,
  diffDays: diffDays,
  dDayLabel: dDayLabel,
  formatShort: formatShort,
  formatRange: formatRange,
  formatTimeRange: formatTimeRange,
  monthKey: monthKey,
  monthLabel: monthLabel,
  addMonths: addMonths,
  WEEKDAYS: WEEKDAYS,
  formatWon: formatWon,
  formatManwon: formatManwon,
  CAMPAIGN_FIELDS: CAMPAIGN_FIELDS,
  ValidationError: ValidationError,
  parseCampaign: parseCampaign,
  parsePlatforms: parsePlatforms,
  loadLocal: loadLocal,
  createLocal: createLocal,
  updateLocal: updateLocal,
  removeLocal: removeLocal,
  savePlatformsLocal: savePlatformsLocal,
  ensurePlatform: ensurePlatform,
  campaignEvents: campaignEvents,
  EVENT_LABEL: EVENT_LABEL,
  upcomingEvents: upcomingEvents,
  savingsMonth: savingsMonth,
  monthlySavings: monthlySavings,
  recentMonths: recentMonths,
  yearSummary: yearSummary,
  parseWinMessage: parseWinMessage,
  loadLinkedPages: loadLinkedPages,
};
})(typeof window !== "undefined" ? window : globalThis);
