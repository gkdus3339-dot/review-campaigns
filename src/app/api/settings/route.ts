import { handleError, json, readBody, viewer } from "@/lib/api";
import { getPlatforms, setPlatforms } from "@/lib/repo";
import { parsePlatforms } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const owner = await viewer(request);
    if (owner instanceof Response) return owner;
    return json({ platforms: await getPlatforms(owner) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const owner = await viewer(request);
    if (owner instanceof Response) return owner;
    const platforms = parsePlatforms(await readBody(request));
    return json({ platforms: await setPlatforms(owner, platforms) });
  } catch (error) {
    return handleError(error);
  }
}
