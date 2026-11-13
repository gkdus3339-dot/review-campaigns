import { diffDays } from "./dates";
import { Campaign, isReviewDone, needsReview, needsVisit } from "./types";

export type EventKind = "visit" | "visitEnd" | "deadline";

export interface CampaignEvent {
  key: string;
  kind: EventKind;
  date: string;
  campaign: Campaign;
  /** True when the step this event stands for is already finished. */
  done: boolean;
}

export const EVENT_LABEL: Record<EventKind, string> = {
  visit: "방문",
  visitEnd: "방문 기한",
  deadline: "리뷰 마감",
};

/** Visit dates (or the end of the visit window when no visit is booked) and review deadlines. */
export function campaignEvents(campaigns: Campaign[]): CampaignEvent[] {
  const events: CampaignEvent[] = [];
  for (const c of campaigns) {
    if (c.status === "취소") continue;
    const visitDone = !needsVisit(c.status);
    if (c.visit_date) {
      events.push({ key: `${c.id}:visit`, kind: "visit", date: c.visit_date, campaign: c, done: visitDone });
    } else if (c.visit_end && !visitDone) {
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
export function upcomingEvents(campaigns: Campaign[], today: string): CampaignEvent[] {
  const order: Record<EventKind, number> = { visit: 0, visitEnd: 1, deadline: 2 };
  return campaignEvents(campaigns)
    .filter((e) => !e.done && (e.kind !== "deadline" || needsReview(e.campaign.status)))
    .sort((a, b) => {
      const da = diffDays(today, a.date);
      const db = diffDays(today, b.date);
      if (da !== db) return da - db;
      return order[a.kind] - order[b.kind];
    });
}
