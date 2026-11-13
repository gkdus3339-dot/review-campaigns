import { handleError, json, readBody, viewer } from "@/lib/api";
import { createCampaign, listCampaigns } from "@/lib/repo";
import { parseCampaign } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const owner = await viewer(request);
    if (owner instanceof Response) return owner;
    return json({ campaigns: await listCampaigns(owner) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const owner = await viewer(request);
    if (owner instanceof Response) return owner;
    const input = parseCampaign(await readBody(request), false);
    const created = await createCampaign(owner, input);
    if (created === "limit") return json({ error: "저장할 수 있는 캠페인 수를 초과했습니다" }, 409);
    return json({ campaign: created }, 201);
  } catch (error) {
    return handleError(error);
  }
}
