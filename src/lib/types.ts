export const STATUSES = ["당첨", "방문 완료", "리뷰 작성 완료", "종료", "취소"] as const;
export type Status = (typeof STATUSES)[number];

export const FLOW_STATUSES: Status[] = ["당첨", "방문 완료", "리뷰 작성 완료", "종료"];

export const CATEGORIES = ["맛집", "카페", "뷰티", "숙박", "제품", "생활/서비스", "기타"] as const;

export const DEFAULT_PLATFORMS = ["레뷰", "강남맛집", "디너의여왕", "리뷰노트", "링블", "기타"];

export interface CampaignInput {
  platform: string;
  business_name: string;
  category: string;
  offer: string;
  amount: number | null;
  region: string;
  phone: string;
  visit_start: string | null;
  visit_end: string | null;
  visit_time_start: string | null;
  visit_time_end: string | null;
  visit_time_note: string;
  visit_date: string | null;
  deadline: string | null;
  won_date: string | null;
  keywords: string;
  guide: string;
  mission: string;
  campaign_url: string;
  review_url: string;
  status: Status;
}

export interface Campaign extends CampaignInput {
  id: string;
  created_at: string;
  updated_at: string;
}

export function emptyCampaign(today: string): CampaignInput {
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
export function needsReview(status: Status): boolean {
  return status === "당첨" || status === "방문 완료";
}

export function needsVisit(status: Status): boolean {
  return status === "당첨";
}

export function isReviewDone(status: Status): boolean {
  return status === "리뷰 작성 완료" || status === "종료";
}

export function isSafeUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+$/i.test(value);
}
