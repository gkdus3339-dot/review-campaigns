"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { todayISO } from "@/lib/dates";
import { ensurePlatform, createLocal, loadLocal, removeLocal, savePlatformsLocal, updateLocal } from "@/lib/store";
import { Campaign, CampaignInput, DEFAULT_PLATFORMS } from "@/lib/types";

interface DataState {
  ready: boolean;
  error: string | null;
  today: string;
  campaigns: Campaign[];
  platforms: string[];
  reload: () => Promise<void>;
  create: (input: CampaignInput) => Promise<Campaign>;
  update: (id: string, patch: Partial<CampaignInput>) => Promise<Campaign>;
  remove: (id: string) => Promise<void>;
  setReviewDone: (campaign: Campaign, done: boolean) => Promise<void>;
  savePlatforms: (platforms: string[]) => Promise<void>;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [platforms, setPlatforms] = useState<string[]>(DEFAULT_PLATFORMS);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = (t: Toast) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const reload = useCallback(async () => {
    try {
      const stored = loadLocal();
      const platforms = ensurePlatform(stored.platforms, "링블");
      if (platforms.length !== stored.platforms.length) savePlatformsLocal(platforms);
      setCampaigns(stored.campaigns);
      setPlatforms(platforms);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오지 못했습니다");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    setToday(todayISO());
    void reload();
  }, [reload]);

  const replace = (c: Campaign) => setCampaigns((list) => list.map((x) => (x.id === c.id ? c : x)));

  const create = useCallback(async (input: CampaignInput) => {
    const campaign = createLocal(input);
    setCampaigns((list) => [campaign, ...list.filter((x) => x.id !== campaign.id)]);
    return campaign;
  }, []);

  const update = useCallback(async (id: string, patch: Partial<CampaignInput>) => {
    const campaign = updateLocal(id, patch);
    replace(campaign);
    return campaign;
  }, []);

  const remove = useCallback(async (id: string) => {
    removeLocal(id);
    setCampaigns((list) => list.filter((x) => x.id !== id));
  }, []);

  const setReviewDone = useCallback(
    async (campaign: Campaign, done: boolean) => {
      const status = done ? "리뷰 작성 완료" : "방문 완료";
      replace({ ...campaign, status });
      try {
        await update(campaign.id, { status });
        showToast({
          message: done ? `'${campaign.business_name}' 리뷰 완료!` : `'${campaign.business_name}' 리뷰 미작성으로 변경`,
          undo: async () => {
            replace(campaign);
            await update(campaign.id, { status: campaign.status });
          },
        });
      } catch (e) {
        replace(campaign);
        showToast({ message: e instanceof Error ? e.message : "저장하지 못했습니다" });
      }
    },
    [update],
  );

  const savePlatforms = useCallback(async (next: string[]) => {
    setPlatforms(savePlatformsLocal(next));
  }, []);

  const value = useMemo(
    () => ({
      ready: ready && today !== "",
      error,
      today,
      campaigns,
      platforms,
      reload,
      create,
      update,
      remove,
      setReviewDone,
      savePlatforms,
    }),
    [ready, error, today, campaigns, platforms, reload, create, update, remove, setReviewDone, savePlatforms],
  );

  return (
    <DataContext.Provider value={value}>
      {children}
      {toast && (
        <div className="toast" role="status">
          <span>{toast.message}</span>
          {toast.undo && (
            <button
              onClick={() => {
                const undo = toast.undo;
                setToast(null);
                void undo?.().catch(() => void reload());
              }}
            >
              되돌리기
            </button>
          )}
        </div>
      )}
    </DataContext.Provider>
  );
}

interface Toast {
  message: string;
  undo?: () => Promise<void>;
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
