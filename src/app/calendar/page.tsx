"use client";

import { useMemo, useState } from "react";
import { CampaignCard } from "@/components/CampaignCard";
import { useData } from "@/components/DataProvider";
import { ChevronLeft, ChevronRight } from "@/components/Icons";
import { ErrorBox, Loading, PageHeader } from "@/components/ui";
import { addMonths, formatShort, monthKey, monthLabel, pad, parseISO, WEEKDAYS } from "@/lib/dates";
import { campaignEvents, CampaignEvent, EVENT_LABEL, upcomingEvents } from "@/lib/events";

export default function CalendarPage() {
  const { ready, error, reload, today, campaigns } = useData();
  const [month, setMonth] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, CampaignEvent[]>();
    for (const e of campaignEvents(campaigns)) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [campaigns]);

  if (!ready) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const current = month ?? monthKey(today);
  const day = selected ?? today;
  const [y, m] = current.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [
    ...Array<null>(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${current}-${pad(i + 1)}`),
  ];
  while (cells.length % 7) cells.push(null);

  const monthEvents = Array.from(byDate.entries()).filter(([date]) => date.startsWith(current));
  const visits = monthEvents.flatMap(([, list]) => list).filter((e) => e.kind !== "deadline").length;
  const deadlines = monthEvents.flatMap(([, list]) => list).filter((e) => e.kind === "deadline").length;
  const dayEvents = byDate.get(day) ?? [];
  const monthAgenda = upcomingEvents(campaigns, today).filter((e) => e.date.startsWith(current) && e.date >= day);

  const go = (delta: number) => {
    const next = addMonths(current, delta);
    setMonth(next);
    setSelected(next === monthKey(today) ? today : `${next}-01`);
  };

  return (
    <div className="stack">
      <PageHeader title="캘린더" sub={`방문 ${visits}건 · 리뷰 마감 ${deadlines}건`} />

      <div className="card calendar">
        <div className="cal-head">
          <button className="icon-btn" onClick={() => go(-1)} aria-label="이전 달">
            <ChevronLeft size={20} />
          </button>
          <button
            className="cal-title"
            onClick={() => {
              setMonth(monthKey(today));
              setSelected(today);
            }}
          >
            {monthLabel(current)}
          </button>
          <button className="icon-btn" onClick={() => go(1)} aria-label="다음 달">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="cal-grid">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`cal-dow${i === 0 ? " sun" : i === 6 ? " sat" : ""}`}>
              {w}
            </div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div key={`e${i}`} className="cal-blank" />;
            const list = byDate.get(date) ?? [];
            const dow = parseISO(date).getDay();
            return (
              <button
                key={date}
                className={`cal-cell${date === today ? " today" : ""}${date === day ? " selected" : ""}${
                  dow === 0 ? " sun" : dow === 6 ? " sat" : ""
                }`}
                onClick={() => setSelected(date)}
                aria-label={`${formatShort(date)} 일정 ${list.length}건`}
              >
                <span className="cal-num">{Number(date.slice(8))}</span>
                <span className="cal-pills">
                  {list.slice(0, 3).map((e) => (
                    <span
                      key={e.key}
                      className={`cal-pill k-${e.kind}${e.done ? " done" : ""}${
                        !e.done && date < today ? " late" : ""
                      }`}
                    >
                      {e.campaign.business_name}
                    </span>
                  ))}
                  {list.length > 3 && <span className="cal-more">+{list.length - 3}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <div className="cal-legend">
          <span>
            <i className="dot k-visit" /> 방문
          </span>
          <span>
            <i className="dot k-visitEnd" /> 방문 기한
          </span>
          <span>
            <i className="dot k-deadline" /> 리뷰 마감
          </span>
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">
          {formatShort(day)} {day === today && <span className="chip">오늘</span>}
          <span className="count">{dayEvents.length}</span>
        </h2>
        {dayEvents.length === 0 ? (
          <>
            <p className="muted pad">이 날은 일정이 없어요.</p>
            {monthAgenda.length > 0 && (
              <>
                <h2 className="section-title">
                  {Number(current.slice(5))}월 남은 일정 <span className="count">{monthAgenda.length}</span>
                </h2>
                <div className="stack-sm">
                  {monthAgenda.map((e) => (
                    <CampaignCard key={e.key} campaign={e.campaign} event={e} today={today} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="stack-sm">
            {dayEvents.map((e) => (
              <div key={e.key}>
                <p className={`event-caption k-${e.kind}`}>
                  {EVENT_LABEL[e.kind]}
                  {e.done && " · 완료"}
                </p>
                <CampaignCard campaign={e.campaign} event={e.done ? null : e} today={today} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
