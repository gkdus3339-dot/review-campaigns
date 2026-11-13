"use client";

import { useParams, useRouter } from "next/navigation";
import { CampaignForm } from "@/components/CampaignForm";
import { useData } from "@/components/DataProvider";
import { ChevronLeft } from "@/components/Icons";
import { Empty, ErrorBox, Loading, PageHeader } from "@/components/ui";
import { CampaignInput } from "@/lib/types";
import { CAMPAIGN_FIELDS } from "@/lib/fields";

export default function EditCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, error, reload, campaigns, update } = useData();
  if (!ready) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) return <Empty title="캠페인을 찾을 수 없어요" />;

  const initial = Object.fromEntries(CAMPAIGN_FIELDS.map((k) => [k, campaign[k]])) as unknown as CampaignInput;
  return (
    <div className="stack">
      <PageHeader
        title="캠페인 수정"
        action={
          <button className="icon-btn" onClick={() => router.back()} aria-label="뒤로">
            <ChevronLeft size={20} />
          </button>
        }
      />
      <CampaignForm
        initial={initial}
        submitLabel="수정 완료"
        showPaste={false}
        onSubmit={async (input) => {
          await update(campaign.id, input);
          router.replace(`/c/${encodeURIComponent(campaign.id)}`);
        }}
      />
    </div>
  );
}
