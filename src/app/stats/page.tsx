"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { ChevronDown } from "@/components/Icons";
import { ErrorBox, Loading, PageHeader, StatusBadge } from "@/components/ui";
import { formatShort, monthKey, monthLabel } from "@/lib/dates";
import { formatManwon, formatWon } from "@/lib/money";
import { monthlySavings, recentMonths, yearSummary } from "@/lib/stats";

const CHART_MONTHS = 6;

export default function StatsPage() {
  const { ready, error, reload, today, campaigns } = useData();
  const months = useMemo(() => monthlySavings(campaigns), [campaigns]);
  const [open, setOpen] = useState<string | null>(null);

  if (!ready) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const current = monthKey(today);
  const year = today.slice(0, 4);
  const summary = yearSummary(months, year);
  const chart = recentMonths(months, current, CHART_MONTHS);
  const max = Math.max(1, ...chart.map((s) => s.total));
  const list = Array.from(months.values()).sort((a, b) => b.key.localeCompare(a.key));
  const expanded = open ?? current;
  const missingAmount = campaigns.filter((c) => c.status !== "취소" && c.amount == null).length;

  return (
    <div className="stack">
      <PageHeader title="절약 금액" sub="체험단으로 아낀 금액 (취소 제외, 방문월 기준)" />

      <div className="summary-grid">
        <div className="summary savings">
          <span className="summary-label">{year}년 누적</span>
          <strong className="summary-value">{formatWon(summary.total)}</strong>
          <span className="summary-foot">캠페인 {summary.count}건</span>
        </div>
        <div className="summary plain">
          <span className="summary-label">이번 달</span>
          <strong className="summary-value">{formatWon(months.get(current)?.total ?? 0)}</strong>
          <span className="summary-foot">캠페인 {months.get(current)?.campaigns.length ?? 0}건</span>
        </div>
      </div>

      <section className="card chart-card">
        <h2 className="section-title">최근 {CHART_MONTHS}개월</h2>
        <div className="bar-chart" role="img" aria-label="최근 월별 절약 금액 막대그래프">
          {chart.map((s) => {
            const pct = Math.round((s.total / max) * 100);
            return (
              <button
                key={s.key}
                className={`bar-col${s.key === current ? " current" : ""}${s.key === expanded ? " picked" : ""}`}
                onClick={() => setOpen(s.key)}
                aria-label={`${monthLabel(s.key)} ${formatWon(s.total)}`}
              >
                <span className="bar-value">{formatManwon(s.total)}</span>
                <span className="bar-track">
                  <span className="bar" style={{ height: `${Math.max(pct, s.total ? 4 : 0)}%` }} />
                </span>
                <span className="bar-label">{Number(s.key.slice(5))}월</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">월별 내역</h2>
        {list.length === 0 ? (
          <p className="muted pad">아직 집계할 캠페인이 없어요.</p>
        ) : (
          <div className="card month-list">
            {list.map((s) => {
              const isOpen = s.key === expanded;
              return (
                <div key={s.key} className={`month-row${isOpen ? " open" : ""}`}>
                  <button className="month-head" onClick={() => setOpen(isOpen ? "" : s.key)} aria-expanded={isOpen}>
                    <span className="month-name">
                      {monthLabel(s.key)}
                      {s.key === current && <span className="chip">이번 달</span>}
                    </span>
                    <span className="month-total">{formatWon(s.total)}</span>
                    <span className="month-count">{s.campaigns.length}건</span>
                    <ChevronDown size={18} className="chev" />
                  </button>
                  {isOpen && (
                    <ul className="month-items">
                      {s.campaigns
                        .slice()
                        .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
                        .map((c) => (
                          <li key={c.id}>
                            <Link href={`/c/${encodeURIComponent(c.id)}`}>
                              <span className="mi-name">
                                {c.business_name}
                                <span className="muted small">
                                  {[c.platform, c.visit_date ? `방문 ${formatShort(c.visit_date)}` : null]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                              </span>
                              <StatusBadge status={c.status} />
                              <span className={`mi-amount${c.amount == null ? " muted" : ""}`}>
                                {c.amount == null ? "금액 미입력" : formatWon(c.amount)}
                              </span>
                            </Link>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {missingAmount > 0 && (
          <p className="muted small pad">제공 금액이 비어 있는 캠페인 {missingAmount}건은 0원으로 계산돼요.</p>
        )}
      </section>
    </div>
  );
}
