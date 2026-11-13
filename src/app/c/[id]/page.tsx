"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useData } from "@/components/DataProvider";
import { ChevronLeft, LinkIcon, MapPinIcon, TrashIcon } from "@/components/Icons";
import { DdayBadge, Empty, ErrorBox, Loading, PageHeader, ReviewToggle, StatusBadge } from "@/components/ui";
import { formatRange, formatShort } from "@/lib/dates";
import { formatWon } from "@/lib/money";
import { FLOW_STATUSES, isReviewDone, isSafeUrl, needsVisit, Status } from "@/lib/types";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, error, reload, today, campaigns, update, remove } = useData();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!ready) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const c = campaigns.find((x) => x.id === id);
  if (!c) {
    return (
      <Empty title="캠페인을 찾을 수 없어요">
        <Link href="/list" className="btn">
          목록으로
        </Link>
      </Empty>
    );
  }

  const setStatus = async (status: Status) => {
    setBusy(true);
    try {
      await update(c.id, { status });
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장하지 못했습니다");
    } finally {
      setBusy(false);
    }
  };

  const keywords = c.keywords
    .split(/[,\n]/)
    .map((k) => k.trim())
    .filter(Boolean);
  const stepIndex = FLOW_STATUSES.indexOf(c.status);
  const visitOpen = needsVisit(c.status);
  const reviewOpen = !isReviewDone(c.status) && c.status !== "취소";

  return (
    <div className="stack">
      <PageHeader
        title="캠페인 상세"
        action={
          <div className="row gap-sm">
            <button className="icon-btn" onClick={() => router.back()} aria-label="뒤로">
              <ChevronLeft size={20} />
            </button>
            <Link href={`/c/${encodeURIComponent(c.id)}/edit`} className="btn small">
              수정
            </Link>
          </div>
        }
      />

      <section className={`card hero${c.status === "취소" ? " cancelled" : ""}`}>
        <div className="cc-meta">
          {c.platform && <span className="chip platform">{c.platform}</span>}
          {c.category && <span className="cc-category">{c.category}</span>}
          <StatusBadge status={c.status} />
        </div>
        <h2 className="hero-name">{c.business_name}</h2>
        {c.offer && <p className="hero-offer">{c.offer}</p>}
        {c.amount != null && <p className="hero-amount">{formatWon(c.amount)} 상당</p>}
        {c.status !== "취소" && (
          <div className="hero-toggle">
            <ReviewToggle campaign={c} />
          </div>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">진행 상태</h3>
        <ol className="stepper">
          {FLOW_STATUSES.map((s, i) => (
            <li key={s} className={`${i < stepIndex ? "past" : ""}${i === stepIndex ? " current" : ""}`}>
              <button disabled={busy} onClick={() => setStatus(s)}>
                <span className="step-dot">{i + 1}</span>
                <span className="step-label">{s}</span>
              </button>
            </li>
          ))}
        </ol>
        <button
          className={`btn small ghost${c.status === "취소" ? "" : " danger-text"}`}
          disabled={busy}
          onClick={() => setStatus(c.status === "취소" ? "당첨" : "취소")}
        >
          {c.status === "취소" ? "취소 되돌리기" : "캠페인 취소로 표시"}
        </button>
      </section>

      <section className="card info">
        <InfoRow label="방문 가능 기간">
          {formatRange(c.visit_start, c.visit_end) || <span className="muted">미정</span>}
          {visitOpen && !c.visit_date && c.visit_end && <DdayBadge date={c.visit_end} today={today} />}
        </InfoRow>
        <InfoRow label="방문 예약일">
          {c.visit_date ? formatShort(c.visit_date) : <span className="muted">미정</span>}
          {visitOpen && c.visit_date && <DdayBadge date={c.visit_date} today={today} />}
        </InfoRow>
        <InfoRow label="리뷰 마감일">
          {c.deadline ? formatShort(c.deadline) : <span className="muted">미정</span>}
          {reviewOpen && c.deadline && <DdayBadge date={c.deadline} today={today} />}
        </InfoRow>
        {c.won_date && <InfoRow label="당첨일">{formatShort(c.won_date)}</InfoRow>}
        {c.region && (
          <InfoRow label="주소/지역">
            <span className="wrap-text">{c.region}</span>
            <a
              className="icon-link"
              href={`https://map.naver.com/p/search/${encodeURIComponent(c.region)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="네이버 지도에서 보기"
            >
              <MapPinIcon size={16} /> 지도
            </a>
          </InfoRow>
        )}
      </section>

      {keywords.length > 0 && (
        <section className="card">
          <div className="card-title-row">
            <h3 className="card-title">필수 키워드</h3>
            <button
              className="btn small ghost"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(keywords.join(", "));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  /* clipboard unavailable */
                }
              }}
            >
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
          <div className="chips wrap">
            {keywords.map((k) => (
              <span key={k} className="chip keyword">
                {k}
              </span>
            ))}
          </div>
        </section>
      )}

      {c.guide && (
        <section className="card">
          <h3 className="card-title">가이드 메모</h3>
          <p className="pre">{c.guide}</p>
        </section>
      )}

      {(c.campaign_url || c.review_url) && (
        <section className="card links">
          {c.campaign_url && <SafeLink href={c.campaign_url} label="캠페인 페이지" />}
          {c.review_url && <SafeLink href={c.review_url} label="작성한 리뷰" />}
        </section>
      )}

      <button
        className="btn ghost danger-text"
        onClick={async () => {
          if (!confirm(`'${c.business_name}' 캠페인을 삭제할까요?`)) return;
          await remove(c.id);
          router.replace("/list");
        }}
      >
        <TrashIcon size={16} /> 삭제
      </button>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{children}</span>
    </div>
  );
}

function SafeLink({ href, label }: { href: string; label: string }) {
  if (!isSafeUrl(href)) return <p className="muted small">{label}: 잘못된 링크</p>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link-row">
      <LinkIcon size={18} />
      <span>
        <strong>{label}</strong>
        <span className="muted small ellipsis">{href}</span>
      </span>
    </a>
  );
}
