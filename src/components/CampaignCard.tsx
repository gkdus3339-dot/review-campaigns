"use client";

import Link from "next/link";
import { diffDays, formatRange, formatShort } from "@/lib/dates";
import { CampaignEvent, EVENT_LABEL, upcomingEvents } from "@/lib/events";
import { formatWon } from "@/lib/money";
import { Campaign } from "@/lib/types";
import { DdayBadge, ReviewToggle, StatusBadge } from "./ui";

export function CampaignCard({
  campaign: c,
  today,
  events = upcomingEvents([c], today),
}: {
  campaign: Campaign;
  today: string;
  /** Events shown on the card; defaults to all open events for this campaign. */
  events?: CampaignEvent[];
}) {
  const overdue = events.some((event) => !event.done && diffDays(today, event.date) < 0);
  const cancelled = c.status === "취소";
  return (
    <div className={`campaign-card${overdue ? " overdue" : ""}${cancelled ? " cancelled" : ""}`}>
      <Link href={`/c/${encodeURIComponent(c.id)}`} className="cc-main">
        <div className="cc-meta">
          {c.platform && <span className="chip platform">{c.platform}</span>}
          {c.category && <span className="cc-category">{c.category}</span>}
          <StatusBadge status={c.status} />
        </div>
        <p className="cc-name">{c.business_name}</p>
        {events.map((event) => (
          <p key={event.key} className={`cc-event k-${event.kind}`}>
            <span className="cc-event-label">{EVENT_LABEL[event.kind]}</span>
            <span>{formatShort(event.date)}</span>
            {event.done ? <span className="muted small">완료</span> : (
              <>
                <DdayBadge date={event.date} today={today} />
                {diffDays(today, event.date) < 0 && <span className="overdue-text">지남</span>}
              </>
            )}
          </p>
        ))}
        {events.length === 0 && (c.visit_start || c.visit_end) && (
          <p className="cc-event muted">방문 {formatRange(c.visit_start, c.visit_end)}</p>
        )}
        {(c.offer || c.amount != null) && (
          <p className="cc-offer">
            {c.offer && <span className="ellipsis">{c.offer.split("\n")[0]}</span>}
            {c.amount != null && <span className="cc-amount">{formatWon(c.amount)}</span>}
          </p>
        )}
      </Link>
      {!cancelled && <ReviewToggle campaign={c} compact />}
    </div>
  );
}
