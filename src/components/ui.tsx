"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { dDayLabel, diffDays } from "@/lib/dates";
import { Campaign, isReviewDone, Status } from "@/lib/types";
import { useData } from "./DataProvider";
import { CheckIcon, SettingsIcon } from "./Icons";

const STATUS_CLASS: Record<Status, string> = {
  당첨: "s-won",
  "방문 완료": "s-visited",
  "리뷰 작성 완료": "s-reviewed",
  종료: "s-closed",
  취소: "s-cancel",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge status ${STATUS_CLASS[status]}`}>{status}</span>;
}

export function DdayBadge({ date, today }: { date: string; today: string }) {
  const days = diffDays(today, date);
  const tone = days < 0 ? "overdue" : days === 0 ? "today" : days <= 3 ? "soon" : "later";
  return <span className={`badge dday ${tone}`}>{dDayLabel(days)}</span>;
}

export function ReviewToggle({ campaign, compact }: { campaign: Campaign; compact?: boolean }) {
  const { setReviewDone } = useData();
  const done = isReviewDone(campaign.status);
  const disabled = campaign.status === "취소";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={done}
      aria-label={`${campaign.business_name} 리뷰 작성 완료`}
      disabled={disabled}
      className={`review-toggle${done ? " on" : ""}${compact ? " compact" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void setReviewDone(campaign, !done);
      }}
    >
      <span className="box">{done && <CheckIcon size={14} strokeWidth={3} />}</span>
      <span className="txt">리뷰 완료</span>
    </button>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {action ?? (
        <Link href="/settings" className="icon-btn" aria-label="설정">
          <SettingsIcon size={20} />
        </Link>
      )}
    </header>
  );
}

export function Loading() {
  return (
    <div className="stack">
      <div className="skeleton tall" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card error-box">
      <p>{message}</p>
      <button className="btn" onClick={onRetry}>
        다시 시도
      </button>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children}
    </div>
  );
}
