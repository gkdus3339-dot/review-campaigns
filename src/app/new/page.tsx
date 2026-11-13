"use client";

import { useRouter } from "next/navigation";
import { CampaignForm } from "@/components/CampaignForm";
import { useData } from "@/components/DataProvider";
import { ChevronLeft } from "@/components/Icons";
import { ErrorBox, Loading, PageHeader } from "@/components/ui";
import { emptyCampaign } from "@/lib/types";

export default function NewCampaignPage() {
  const router = useRouter();
  const { ready, error, reload, today, create } = useData();
  if (!ready) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <div className="stack">
      <PageHeader
        title="체험단 추가"
        action={
          <button className="icon-btn" onClick={() => router.back()} aria-label="뒤로">
            <ChevronLeft size={20} />
          </button>
        }
      />
      <CampaignForm
        initial={emptyCampaign(today)}
        submitLabel="저장하기"
        showPaste
        onSubmit={async (input) => {
          const c = await create(input);
          router.replace(`/c/${encodeURIComponent(c.id)}`);
        }}
      />
    </div>
  );
}
