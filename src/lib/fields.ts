import { CampaignInput } from "./types";

export const CAMPAIGN_FIELDS: (keyof CampaignInput)[] = [
  "platform",
  "business_name",
  "category",
  "offer",
  "amount",
  "region",
  "visit_start",
  "visit_end",
  "visit_date",
  "deadline",
  "won_date",
  "keywords",
  "guide",
  "campaign_url",
  "review_url",
  "status",
];
