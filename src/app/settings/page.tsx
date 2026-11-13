"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useData } from "@/components/DataProvider";
import { ChevronLeft, TrashIcon } from "@/components/Icons";
import { ErrorBox, Loading, PageHeader } from "@/components/ui";
import { DEFAULT_PLATFORMS } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const { ready, error, reload, platforms, savePlatforms } = useData();
  const [list, setList] = useState<string[]>(platforms);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => setList(platforms), [platforms]);

  if (!ready) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const save = async (next: string[]) => {
    setList(next);
    try {
      await savePlatforms(next);
      setStatus("저장했어요");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "저장하지 못했습니다");
      setList(platforms);
    }
    setTimeout(() => setStatus(null), 1500);
  };

  const move = (i: number, delta: number) => {
    const next = [...list];
    const [item] = next.splice(i, 1);
    next.splice(i + delta, 0, item);
    void save(next);
  };

  return (
    <div className="stack">
      <PageHeader
        title="설정"
        action={
          <button className="icon-btn" onClick={() => router.back()} aria-label="뒤로">
            <ChevronLeft size={20} />
          </button>
        }
      />
      <section className="card">
        <div className="card-title-row">
          <h3 className="card-title">플랫폼 목록</h3>
          {status && <span className="muted small">{status}</span>}
        </div>
        <p className="muted small">입력 화면에 표시되고, 당첨 메시지에서 이 이름을 찾아 자동으로 선택해요.</p>
        <ul className="platform-list">
          {list.map((p, i) => (
            <li key={p}>
              <span>{p}</span>
              <div className="row gap-sm">
                <button className="icon-btn sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`${p} 위로`}>
                  ↑
                </button>
                <button
                  className="icon-btn sm"
                  disabled={i === list.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`${p} 아래로`}
                >
                  ↓
                </button>
                <button
                  className="icon-btn sm danger-text"
                  onClick={() => void save(list.filter((x) => x !== p))}
                  aria-label={`${p} 삭제`}
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <form
          className="row gap"
          onSubmit={(e) => {
            e.preventDefault();
            const n = name.trim();
            if (!n || list.includes(n)) return;
            setName("");
            void save([...list, n]);
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="새 플랫폼 이름" maxLength={40} />
          <button type="submit" className="btn primary" disabled={!name.trim() || list.length >= 30}>
            추가
          </button>
        </form>
        <button className="btn ghost small" onClick={() => void save(DEFAULT_PLATFORMS)}>
          기본값으로 되돌리기
        </button>
      </section>
      <p className="muted small center">이 기기의 브라우저에만 저장돼요. 다른 휴대폰이나 PC에서는 비어 있고, 새로고침하거나 탭을 닫아도 여기 데이터는 남아요.</p>
    </div>
  );
}
