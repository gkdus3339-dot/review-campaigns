import { isValidISO } from "./dates";
import { CAMPAIGN_FIELDS } from "./fields";
import { CampaignInput, isSafeUrl, STATUSES, Status } from "./types";

const LIMITS: Record<string, number> = {
  platform: 40,
  business_name: 120,
  category: 40,
  offer: 1000,
  region: 300,
  phone: 40,
  keywords: 1000,
  guide: 5000,
  mission: 8000,
  campaign_url: 2000,
  review_url: 2000,
};

export class ValidationError extends Error {}

function text(value: unknown, field: string): string {
  if (value == null) return "";
  if (typeof value !== "string") throw new ValidationError(`${field}: 문자열이어야 합니다`);
  const trimmed = value.trim();
  if (trimmed.length > LIMITS[field]) throw new ValidationError(`${field}: 너무 깁니다`);
  return trimmed;
}

function date(value: unknown, field: string): string | null {
  if (value == null || value === "") return null;
  if (!isValidISO(value)) throw new ValidationError(`${field}: 날짜 형식이 올바르지 않습니다`);
  return value;
}

function clock(value: unknown, field: string): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new ValidationError(`${field}: 시간 형식이 올바르지 않습니다`);
  }
  return value;
}

function url(value: unknown, field: string): string {
  const v = text(value, field);
  if (v !== "" && !isSafeUrl(v)) throw new ValidationError(`${field}: http(s) 주소만 입력할 수 있습니다`);
  return v;
}

function amount(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 1_000_000_000) throw new ValidationError("amount: 올바른 금액이 아닙니다");
  return n;
}

function status(value: unknown): Status {
  if (value == null || value === "") return "당첨";
  if (!STATUSES.includes(value as Status)) throw new ValidationError("status: 알 수 없는 상태입니다");
  return value as Status;
}

const PARSERS: { [K in keyof CampaignInput]: (v: unknown) => CampaignInput[K] } = {
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

export { CAMPAIGN_FIELDS };

/** Validates a full campaign (create) or only the given fields (update). */
export function parseCampaign(body: unknown, partial: boolean): Partial<CampaignInput> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("잘못된 요청입니다");
  }
  const input = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const field of CAMPAIGN_FIELDS) {
    if (partial && !(field in input)) continue;
    out[field] = PARSERS[field](input[field]);
  }
  if ((!partial || "business_name" in input) && !out.business_name) {
    throw new ValidationError("업체명을 입력해 주세요");
  }
  return out as Partial<CampaignInput>;
}

export function parsePlatforms(body: unknown): string[] {
  const list = (body as { platforms?: unknown })?.platforms;
  if (!Array.isArray(list) || list.length > 30) throw new ValidationError("플랫폼 목록이 올바르지 않습니다");
  const names: string[] = [];
  for (const item of list) {
    const name = text(item, "platform");
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}
