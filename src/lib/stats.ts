import { addMonths, monthKey } from "./dates";
import { Campaign } from "./types";

export interface MonthStat {
  key: string;
  total: number;
  campaigns: Campaign[];
}

/** Month a campaign's savings count toward: visit date, else win date, else creation date. */
export function savingsMonth(c: Campaign): string {
  if (c.visit_date) return monthKey(c.visit_date);
  if (c.won_date) return monthKey(c.won_date);
  return monthKey(c.created_at.slice(0, 10));
}

export function monthlySavings(campaigns: Campaign[]): Map<string, MonthStat> {
  const months = new Map<string, MonthStat>();
  for (const c of campaigns) {
    if (c.status === "취소") continue;
    const key = savingsMonth(c);
    const stat = months.get(key) ?? { key, total: 0, campaigns: [] };
    stat.total += c.amount ?? 0;
    stat.campaigns.push(c);
    months.set(key, stat);
  }
  return months;
}

export function recentMonths(months: Map<string, MonthStat>, currentKey: string, count: number): MonthStat[] {
  const result: MonthStat[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const key = addMonths(currentKey, -i);
    result.push(months.get(key) ?? { key, total: 0, campaigns: [] });
  }
  return result;
}

export function yearSummary(months: Map<string, MonthStat>, year: string) {
  let total = 0;
  let count = 0;
  for (const stat of months.values()) {
    if (!stat.key.startsWith(`${year}-`)) continue;
    total += stat.total;
    count += stat.campaigns.length;
  }
  return { total, count };
}
