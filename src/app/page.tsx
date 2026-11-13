"use client";

import Link from "next/link";
import { CampaignCard } from "@/components/CampaignCard";
import { useData } from "@/components/DataProvider";
import { ClipboardIcon, PlusIcon } from "@/components/Icons";
import { Empty, ErrorBox, Loading, PageHeader } from "@/components/ui";
import { diffDays, formatShort, monthKey, parseISO, WEEKDAYS } from "@/lib/dates";
import { upcomingEvents } from "@/lib/events";
import { formatWon } from "@/lib/money";
import { monthlySavings } from "@/lib/stats";
import { needsReview } from "@/lib/types";

const UPCOMING_WINDOW_DAYS = 30;

export default function Dashboard() {
  const { ready, error, reload, today, campaigns } = useData();
  if (!ready) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const d = parseISO(today);
  const events = upcomingEvents(campaigns, today);
  const overdue = events.filter((e) => diffDays(today, e.date) < 0);
  const soon = events.filter((e) => {
    const days = diffDays(today, e.date);
    return days >= 0 && days <= UPCOMING_WINDOW_DAYS;
  });
  const later = events.length - overdue.length - soon.length;

  const unwritten = campaigns.filter((c) => needsReview(c.status));
  const overdueReviews = unwritten.filter((c) => c.deadline && c.deadline < today);
  const undated = unwritten.filter((c) => !c.deadline && !events.some((e) => e.campaign.id === c.id));

  const thisMonth = monthlySavings(campaigns).get(monthKey(today));

  return (
    <div className="stack">
      <PageHeader
        title="체험단 노트"
        sub={`${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`}
      />

      <div className="summary-grid">
        <Link href="/stats" className="summary savings">
          <span className="summary-label">{d.getMonth() + 1}월 절약 금액</span>
          <strong className="summary-value">{formatWon(thisMonth?.total ?? 0)}</strong>
          <span className="summary-foot">캠페인 {thisMonth?.campaigns.length ?? 0}건</span>
        </Link>
        <Link
          href="/list?filter=unwritten"
          className={`summary unwritten${overdueReviews.length ? " alert" : unwritten.length ? " warn" : ""}`}
        >
          <span className="summary-label">미작성 리뷰</span>
          <strong className="summary-value">{unwritten.length}건</strong>
          <span className="summary-foot">
            {overdueReviews.length ? `마감 지남 ${overdueReviews.length}건` : unwritten.length ? "작성 대기 중" : "모두 완료!"}
          </span>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Empty title="아직 등록된 체험단이 없어요">
          <p>당첨 문자나 카톡을 붙여넣으면 자동으로 채워 드려요.</p>
          <div className="row gap">
            <Link href="/new?paste=1" className="btn primary">
              <ClipboardIcon size={18} /> 당첨 메시지 붙여넣기
            </Link>
            <Link href="/new" className="btn">
              <PlusIcon size={18} /> 직접 입력
            </Link>
          </div>
        </Empty>
      ) : (
        <>
          {overdue.length > 0 && (
            <section className="section">
              <h2 className="section-title danger">
                기한 지남 <span className="count">{overdue.length}</span>
              </h2>
              <div className="stack-sm">
                {overdue.map((e) => (
                  <CampaignCard key={e.key} campaign={e.campaign} event={e} today={today} />
                ))}
              </div>
            </section>
          )}

          <section className="section">
            <h2 className="section-title">
              다가오는 일정 <span className="count">{soon.length}</span>
            </h2>
            {soon.length === 0 ? (
              <p className="muted pad">앞으로 {UPCOMING_WINDOW_DAYS}일 안에 예정된 방문이나 마감이 없어요.</p>
            ) : (
              <div className="stack-sm">
                {soon.map((e) => (
                  <CampaignCard key={e.key} campaign={e.campaign} event={e} today={today} />
                ))}
              </div>
            )}
            {later > 0 && (
              <Link href="/calendar" className="more-link">
                이후 일정 {later}건 캘린더에서 보기 →
              </Link>
            )}
          </section>

          {undated.length > 0 && (
            <section className="section">
              <h2 className="section-title">
                날짜 미정 · 리뷰 미작성 <span className="count">{undated.length}</span>
              </h2>
              <div className="stack-sm">
                {undated.map((c) => (
                  <CampaignCard key={c.id} campaign={c} event={null} today={today} />
                ))}
              </div>
            </section>
          )}

          <p className="muted small center">
            오늘 {formatShort(today)} 기준 · 방문일과 리뷰 마감일이 가까운 순서
          </p>
        </>
      )}
    </div>
  );
}
