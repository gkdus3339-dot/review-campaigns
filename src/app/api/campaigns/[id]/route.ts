import { handleError, json, readBody, viewer } from "@/lib/api";
import { deleteCampaign, updateCampaign } from "@/lib/repo";
import { parseCampaign } from "@/lib/validate";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const owner = await viewer(request);
    if (owner instanceof Response) return owner;
    const { id } = await params;
    const input = parseCampaign(await readBody(request), true);
    const updated = await updateCampaign(owner, id, input);
    if (!updated) return json({ error: "캠페인을 찾을 수 없습니다" }, 404);
    return json({ campaign: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const owner = await viewer(request);
    if (owner instanceof Response) return owner;
    if (request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "허용되지 않은 요청입니다" }, 403);
    const { id } = await params;
    if (!(await deleteCampaign(owner, id))) return json({ error: "캠페인을 찾을 수 없습니다" }, 404);
    return new Response(null, { status: 204, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return handleError(error);
  }
}
