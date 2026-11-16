"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useState } from "react";
import { loadLinkedPages } from "@/lib/fetch-pages";
import { parseWinMessage } from "@/lib/parser";
import { CampaignInput, CATEGORIES, isSafeUrl, STATUSES } from "@/lib/types";
import { useData } from "./DataProvider";
import { ChevronDown, ClipboardIcon, SparkleIcon } from "./Icons";
import { MissionText } from "./MissionText";

type Key = keyof CampaignInput;

const FIELD_LABEL: Partial<Record<Key, string>> = {
  platform: "체험단",
  business_name: "업체명",
  category: "카테고리",
  offer: "제공 내역",
  amount: "제공 금액",
  region: "주소/지역",
  phone: "연락할 번호",
  visit_start: "방문 시작일",
  visit_end: "방문 종료일",
  visit_time_start: "방문 시작 시간",
  visit_time_end: "방문 종료 시간",
  visit_time_note: "방문 시간 안내",
  visit_date: "방문 예약일",
  deadline: "리뷰 마감일",
  won_date: "당첨일",
  keywords: "필수 키워드",
  mission: "미션",
  guide: "가이드 메모",
  campaign_url: "캠페인 링크",
  status: "상태",
};

const SAMPLE = `[레뷰] 캠페인 선정 안내
[서울 마포] '오늘도파스타' 캠페인에 선정되셨습니다🎉
■ 제공내역 : 파스타 2종 + 음료 2잔 (5만원 상당)
■ 방문기간 : 11.15(토) ~ 11.30(일)
■ 리뷰 등록기간 : 11.16 ~ 12.07
■ 주소 : 서울 마포구 동교로 123 1층
■ 필수 키워드 : 연남동 파스타, 연남동 맛집
■ 가이드
- 사진 15장 이상, 지도 첨부 필수
https://www.revu.net/campaign/123456`;

export function CampaignForm({
  initial,
  submitLabel,
  onSubmit,
  showPaste,
}: {
  initial: CampaignInput;
  submitLabel: string;
  onSubmit: (input: CampaignInput) => Promise<void>;
  showPaste?: boolean;
}) {
  const { platforms, today } = useData();
  const [form, setForm] = useState<CampaignInput>(initial);
  const [amountText, setAmountText] = useState(initial.amount != null ? initial.amount.toLocaleString("ko-KR") : "");
  const [auto, setAuto] = useState<Set<Key>>(new Set());
  const [pasteOpen, setPasteOpen] = useState(Boolean(showPaste));
  const [message, setMessage] = useState("");
  const [parseNote, setParseNote] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends Key>(key: K, value: CampaignInput[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "visit_date" && value && f.status === "당첨") next.status = "방문 예정";
      return next;
    });
    setAuto((a) => {
      if (!a.has(key)) return a;
      const n = new Set(a);
      n.delete(key);
      return n;
    });
  };

  const applyParse = async (text: string) => {
    if (reading) return;
    setReading(true);
    setMessage(text);
    setParseNote("메시지와 안의 링크를 읽고 있어요...");
    let pages: { url: string; text: string }[] = [];
    let failed: string[] = [];
    try {
      const loaded = await loadLinkedPages(text);
      pages = loaded.pages;
      failed = loaded.failed;
    } catch {
      failed = [];
    }
    const { fields, filled } = parseWinMessage(text, { today, platforms, pages });
    setReading(false);
    if (filled.length === 0) {
      setParseNote("인식된 항목이 없어요. 메시지를 확인하거나 직접 입력해 주세요.");
      return;
    }
    setForm((f) => ({ ...f, ...fields }));
    if (fields.amount !== undefined) setAmountText(fields.amount?.toLocaleString("ko-KR") ?? "");
    setAuto(new Set(filled));
    const names = filled.map((k) => FIELD_LABEL[k]).filter(Boolean);
    const missed = failed.length ? ` 이 링크는 읽지 못했습니다: ${failed.join(", ")}.` : "";
    setParseNote(`${names.length}개 항목을 채웠어요: ${names.join(", ")}.${missed} 아래에서 확인 후 저장하세요.`);
    setPasteOpen(false);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setMessage(text);
        applyParse(text);
      }
    } catch {
      setParseNote("클립보드에 접근할 수 없어요. 입력칸에 길게 눌러 붙여넣어 주세요.");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.business_name.trim()) {
      setError("업체명을 입력해 주세요");
      return;
    }
    const digits = amountText.replace(/[^\d]/g, "");
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ ...form, amount: digits ? Number(digits) : null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했습니다");
      setSaving(false);
    }
  };

  const platformOptions = form.platform && !platforms.includes(form.platform) ? [...platforms, form.platform] : platforms;
  const categoryOptions: string[] =
    form.category && !(CATEGORIES as readonly string[]).includes(form.category)
      ? [...CATEGORIES, form.category]
      : [...CATEGORIES];

  const isAuto = (k: Key) => auto.has(k);

  return (
    <form onSubmit={submit} className="stack form">
      {showPaste !== undefined && (
        <section className={`card paste${pasteOpen ? " open" : ""}`}>
          <button type="button" className="paste-head" onClick={() => setPasteOpen((o) => !o)} aria-expanded={pasteOpen}>
            <span className="paste-icon">
              <ClipboardIcon size={20} />
            </span>
            <span className="paste-title">
              <strong>당첨 메시지 붙여넣기</strong>
              <span className="muted small">문자·카톡·메일 내용을 붙여넣으면 자동으로 채워져요</span>
            </span>
            <ChevronDown size={18} className="chev" />
          </button>
          {pasteOpen && (
            <div className="paste-body">
              <textarea
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={"예) [레뷰] 캠페인 선정 안내\n■ 제공내역 : 2인 코스 (6만원 상당)\n■ 방문기간 : 11.15 ~ 11.30\n■ 리뷰 마감 : 12.07"}
                aria-label="당첨 메시지"
              />
              <div className="row gap wrap">
                <button type="button" className="btn primary" onClick={() => void applyParse(message)} disabled={reading || !message.trim()}>
                  <SparkleIcon size={18} /> {reading ? "읽는 중..." : "자동 채우기"}
                </button>
                <button type="button" className="btn" onClick={pasteFromClipboard}>
                  클립보드에서 붙여넣기
                </button>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => {
                    setMessage(SAMPLE);
                    applyParse(SAMPLE);
                  }}
                >
                  예시로 해보기
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      {parseNote && (
        <p className="parse-note" role="status">
          <SparkleIcon size={16} /> {parseNote}
        </p>
      )}

      <section className="card fields">
        <Field label="체험단" group auto={isAuto("platform")} hint="카테고리와 별개예요" extra={<Link href="/settings" className="link small">편집</Link>}>
          <div className="chips wrap">
            {platformOptions.map((p) => (
              <button
                type="button"
                key={p}
                className={`chip-btn${form.platform === p ? " active" : ""}`}
                onClick={() => set("platform", form.platform === p ? "" : p)}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>

        <Field label="업체명" required auto={isAuto("business_name")}>
          <input
            value={form.business_name}
            onChange={(e) => set("business_name", e.target.value)}
            placeholder="예) 오늘도파스타"
            maxLength={120}
            required
          />
        </Field>

        <Field label="카테고리" group auto={isAuto("category")}>
          <div className="chips wrap">
            {categoryOptions.map((c) => (
              <button
                type="button"
                key={c}
                className={`chip-btn${form.category === c ? " active" : ""}`}
                onClick={() => set("category", form.category === c ? "" : c)}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <Field label="제공 내역" auto={isAuto("offer")}>
          <textarea
            rows={2}
            value={form.offer}
            onChange={(e) => set("offer", e.target.value)}
            placeholder="예) 2인 코스 + 음료"
            maxLength={1000}
          />
        </Field>

        <Field label="제공 금액" auto={isAuto("amount")}>
          <div className="input-suffix">
            <input
              inputMode="numeric"
              value={amountText}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^\d]/g, "").slice(0, 10);
                setAmountText(digits ? Number(digits).toLocaleString("ko-KR") : "");
                setAuto((a) => {
                  const n = new Set(a);
                  n.delete("amount");
                  return n;
                });
              }}
              placeholder="0"
              aria-label="제공 금액"
            />
            <span>원</span>
          </div>
        </Field>

        <Field label="주소/지역" auto={isAuto("region")}>
          <input
            value={form.region}
            onChange={(e) => set("region", e.target.value)}
            placeholder="예) 서울 마포구 동교로 123"
            maxLength={300}
          />
        </Field>

        <Field label="연락할 번호" auto={isAuto("phone")}>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="예) 010-1234-5678 또는 톡 링크"
            maxLength={300}
          />
          {isSafeUrl(form.phone) ? (
            <a className="contact-link" href={form.phone} target="_blank" rel="noopener noreferrer">
              {form.phone}
            </a>
          ) : null}
        </Field>
      </section>

      <section className="card fields">
        <Field label="방문 가능 기간" auto={isAuto("visit_start") || isAuto("visit_end")}>
          <div className="date-range">
            <input
              type="date"
              value={form.visit_start ?? ""}
              onChange={(e) => set("visit_start", e.target.value || null)}
              aria-label="방문 시작일"
            />
            <span>~</span>
            <input
              type="date"
              value={form.visit_end ?? ""}
              onChange={(e) => set("visit_end", e.target.value || null)}
              aria-label="방문 종료일"
            />
          </div>
        </Field>
        <Field label="방문 가능 시간" auto={isAuto("visit_time_start") || isAuto("visit_time_end")} hint="예) 11:00–15:00">
          <div className="date-range">
            <input
              type="time"
              value={form.visit_time_start ?? ""}
              onChange={(e) => set("visit_time_start", e.target.value || null)}
              aria-label="방문 시작 시간"
            />
            <span>~</span>
            <input
              type="time"
              value={form.visit_time_end ?? ""}
              onChange={(e) => set("visit_time_end", e.target.value || null)}
              aria-label="방문 종료 시간"
            />
          </div>
          <input
            value={form.visit_time_note}
            onChange={(e) => set("visit_time_note", e.target.value)}
            placeholder="예) 평일, 주말 11:00–20:00 / 공휴일 방문 불가"
            maxLength={300}
            aria-label="방문 시간 안내"
          />
        </Field>
        <div className="two-col">
          <Field label="방문 예약일" auto={isAuto("visit_date")}>
            <input type="date" value={form.visit_date ?? ""} onChange={(e) => set("visit_date", e.target.value || null)} />
          </Field>
          <Field label="리뷰 마감일" auto={isAuto("deadline")}>
            <input type="date" value={form.deadline ?? ""} onChange={(e) => set("deadline", e.target.value || null)} />
          </Field>
        </div>
        <Field label="당첨일" auto={isAuto("won_date")} hint="방문일이 없을 때 절약 금액 집계 기준">
          <input type="date" value={form.won_date ?? ""} onChange={(e) => set("won_date", e.target.value || null)} />
        </Field>
        <Field label="상태" group auto={isAuto("status")}>
          <div className="chips wrap">
            {STATUSES.map((s) => (
              <button
                type="button"
                key={s}
                className={`chip-btn${form.status === s ? " active" : ""}${s === "취소" ? " danger" : ""}`}
                onClick={() => set("status", s)}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>
      </section>

      <section className="card fields">
        <Field label="필수 키워드" auto={isAuto("keywords")} hint="쉼표로 구분">
          <input
            value={form.keywords}
            onChange={(e) => set("keywords", e.target.value)}
            placeholder="예) 연남동 맛집, 홍대 데이트"
            maxLength={1000}
          />
        </Field>
        <Field label="미션" auto={isAuto("mission")} hint="번호와 링크를 그대로 붙여 넣어요">
          <textarea
            rows={8}
            value={form.mission}
            onChange={(e) => set("mission", e.target.value)}
            placeholder="1. 제목에 키워드를 넣어 주세요"
            maxLength={8000}
          />
          {form.mission.trim() ? (
            <div className="mission preview">
              <MissionText text={form.mission} />
            </div>
          ) : null}
        </Field>
        <Field label="가이드 메모" auto={isAuto("guide")}>
          <textarea
            rows={4}
            value={form.guide}
            onChange={(e) => set("guide", e.target.value)}
            placeholder="사진 장수, 필수 문구, 지도 첨부 등"
            maxLength={5000}
          />
        </Field>
        <Field label="캠페인 링크" auto={isAuto("campaign_url")}>
          <input
            type="url"
            inputMode="url"
            value={form.campaign_url}
            onChange={(e) => set("campaign_url", e.target.value)}
            placeholder="https://"
            maxLength={2000}
          />
        </Field>
        <Field label="작성한 리뷰 URL">
          <input
            type="url"
            inputMode="url"
            value={form.review_url}
            onChange={(e) => set("review_url", e.target.value)}
            placeholder="https://blog.naver.com/..."
            maxLength={2000}
          />
        </Field>
      </section>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="sticky-actions">
        <button type="submit" className="btn primary block" disabled={saving}>
          {saving ? "저장 중..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  auto,
  hint,
  extra,
  group,
  children,
}: {
  label: string;
  required?: boolean;
  auto?: boolean;
  hint?: string;
  extra?: ReactNode;
  /** Chip groups hold several buttons, which a wrapping <label> would activate on any tap. */
  group?: boolean;
  children: ReactNode;
}) {
  const head = (
    <span className="field-label">
      {label}
      {required && <em>*</em>}
      {auto && <span className="auto-tag">자동 입력</span>}
      {hint && <span className="hint">{hint}</span>}
      {extra && <span className="field-extra">{extra}</span>}
    </span>
  );
  const className = `field${auto ? " auto" : ""}`;
  if (group) {
    return (
      <div className={className} role="group" aria-label={label}>
        {head}
        {children}
      </div>
    );
  }
  return (
    <label className={className}>
      {head}
      {children}
    </label>
  );
}
