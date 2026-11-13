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
  event,
}: {
  campaign: Campaign;
  today: string;
  /** Event to feature; defaults to the campaign's most urgent open one. */
  event?: CampaignEvent | null;
}) {
  const shown = event === undefined ? (upcomingEvents([c], today)[0] ?? null) : event;
  const overdue = shown ? diffDays(today, shown.date) < 0 : false;
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
        {shown ? (
          <p className={`cc-event k-${shown.kind}`}>
            <span className="cc-event-label">{EVENT_LABEL[shown.kind]}</span>
            <span>{formatShort(shown.date)}</span>
            <DdayBadge date={shown.date} today={today} />
            {overdue && <span className="overdue-text">지남</span>}
          </p>
        ) : (
          (c.visit_start || c.visit_end) && (
            <p className="cc-event muted">방문 {formatRange(c.visit_start, c.visit_end)}</p>
          )
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
