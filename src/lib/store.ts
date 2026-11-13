import { Campaign, CampaignInput, DEFAULT_PLATFORMS } from "./types";
import { parseCampaign, parsePlatforms, ValidationError } from "./validate";

const STORAGE_KEY = "review-notes.v1";
const MAX_CAMPAIGNS = 5000;

interface Stored {
  campaigns: Campaign[];
  platforms: string[];
}

function empty(): Stored {
  return { campaigns: [], platforms: [...DEFAULT_PLATFORMS] };
}

function read(): Stored {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    throw new Error("이 브라우저에는 저장할 수 없습니다");
  }
  if (!raw) return empty();
  try {
    const parsed = JSON.parse(raw) as { campaigns?: unknown; platforms?: unknown };
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
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    return empty();
  }
}

function write(data: Stored): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
      throw new Error("이 기기의 저장 공간이 부족합니다");
    }
    throw new Error("이 브라우저에는 저장할 수 없습니다");
  }
}

function asPlatforms(value: unknown): string[] {
  try {
    return parsePlatforms({ platforms: value });
  } catch {
    return [...DEFAULT_PLATFORMS];
  }
}

function asCampaign(value: unknown): Campaign | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || row.id.length === 0 || row.id.length > 80) return null;
  try {
    const fields = parseCampaign(row, false) as CampaignInput;
    const created = typeof row.created_at === "string" && row.created_at.length >= 10 ? row.created_at : new Date().toISOString();
    const updated = typeof row.updated_at === "string" ? row.updated_at : created;
    return { id: row.id, ...fields, created_at: created, updated_at: updated };
  } catch {
    return null;
  }
}

export function loadLocal(): Stored {
  return read();
}

export function createLocal(input: CampaignInput): Campaign {
  const data = read();
  if (data.campaigns.length >= MAX_CAMPAIGNS) throw new Error("저장할 수 있는 캠페인 수를 초과했습니다");
  const fields = parseCampaign(input, false) as CampaignInput;
  const now = new Date().toISOString();
  const campaign: Campaign = { id: crypto.randomUUID(), ...fields, created_at: now, updated_at: now };
  data.campaigns.unshift(campaign);
  write(data);
  return campaign;
}

export function updateLocal(id: string, patch: Partial<CampaignInput>): Campaign {
  const data = read();
  const index = data.campaigns.findIndex((c) => c.id === id);
  if (index < 0) throw new Error("캠페인을 찾을 수 없습니다");
  const fields = parseCampaign(patch, true);
  const campaign: Campaign = { ...data.campaigns[index], ...fields, updated_at: new Date().toISOString() };
  data.campaigns[index] = campaign;
  write(data);
  return campaign;
}

export function removeLocal(id: string): void {
  const data = read();
  const next = data.campaigns.filter((c) => c.id !== id);
  if (next.length === data.campaigns.length) throw new Error("캠페인을 찾을 수 없습니다");
  data.campaigns = next;
  write(data);
}

export function savePlatformsLocal(platforms: string[]): string[] {
  const data = read();
  data.platforms = parsePlatforms({ platforms });
  write(data);
  return data.platforms;
}
