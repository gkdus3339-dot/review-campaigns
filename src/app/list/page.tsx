"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { CampaignCard } from "@/components/CampaignCard";
import { useData } from "@/components/DataProvider";
import { SearchIcon } from "@/components/Icons";
import { Empty, ErrorBox, Loading, PageHeader } from "@/components/ui";
import { upcomingEvents } from "@/lib/events";
import { needsReview, STATUSES } from "@/lib/types";

const UNWRITTEN = "unwritten";
type Sort = "urgent" | "recent";

export default function ListPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CampaignList />
    </Suspense>
  );
}

function CampaignList() {
  const params = useSearchParams();
  const { ready, error, reload, today, campaigns, platforms } = useData();
  const [status, setStatus] = useState<string>(params.get("filter") === UNWRITTEN ? UNWRITTEN : "");
  const [platform, setPlatform] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("urgent");

  const platformOptions = useMemo(() => {
    const names = [...platforms];
    for (const c of campaigns) if (c.platform && !names.includes(c.platform)) names.push(c.platform);
    return names;
  }, [platforms, campaigns]);

  const filtered = useMemo(() => {
    if (!today) return [];
    const q = query.trim().toLowerCase();
    const list = campaigns.filter((c) => {
      if (status === UNWRITTEN ? !needsReview(c.status) : status && c.status !== status) return false;
      if (platform && c.platform !== platform) return false;
      if (!q) return true;
      return [c.business_name, c.platform, c.category, c.offer, c.region, c.keywords, c.guide]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    if (sort === "recent") return list;
    const next = new Map(list.map((c) => [c.id, upcomingEvents([c], today)[0]?.date ?? null]));
    return [...list].sort((a, b) => {
      const da = next.get(a.id);
      const db = next.get(b.id);
      if (da && db) return da.localeCompare(db);
      if (da) return -1;
      if (db) return 1;
      return 0;
    });
  }, [campaigns, status, platform, query, sort, today]);

  if (!ready) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const unwrittenCount = campaigns.filter((c) => needsReview(c.status)).length;
  const statusChips: { value: string; label: string }[] = [
    { value: "", label: "전체" },
    { value: UNWRITTEN, label: `미작성 리뷰 ${unwrittenCount}` },
    ...STATUSES.map((s) => ({ value: s, label: s })),
  ];

  return (
    <div className="stack">
      <PageHeader title="캠페인 목록" sub={`전체 ${campaigns.length}건`} />

      <div className="search">
        <SearchIcon size={18} />
        <input
          type="search"
          placeholder="업체명, 지역, 키워드 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="검색"
        />
      </div>

      <div className="chips scroll" role="group" aria-label="상태 필터">
        {statusChips.map((s) => (
          <button
            key={s.value || "all"}
            className={`chip-btn${status === s.value ? " active" : ""}${s.value === UNWRITTEN ? " warn" : ""}`}
            onClick={() => setStatus(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="row gap">
        <select className="select" value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="플랫폼">
          <option value="">모든 플랫폼</option>
          {platformOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="정렬">
          <option value="urgent">급한 순</option>
          <option value="recent">최근 등록순</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Empty title={campaigns.length ? "조건에 맞는 캠페인이 없어요" : "아직 등록된 캠페인이 없어요"} />
      ) : (
        <div className="stack-sm">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} today={today} />
          ))}
        </div>
      )}
    </div>
  );
}
