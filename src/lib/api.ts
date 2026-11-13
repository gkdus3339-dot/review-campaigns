import "server-only";
import { requireIdentity } from "../../cursor/identity.js";
import { ValidationError } from "./validate";

const NO_STORE = { "cache-control": "private, no-store" };
const MAX_BODY_BYTES = 64 * 1024;

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

/** Returns the viewer's stable id, or a Response to send back as is. */
export async function viewer(request: Request): Promise<string | Response> {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;
  return identity.sub;
}

/** Reads a JSON body from a same-site request; cross-site and non-JSON writes are refused. */
export async function readBody(request: Request): Promise<unknown> {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    throw new HttpError(403, "허용되지 않은 요청입니다");
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "JSON 요청만 허용됩니다");
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) throw new HttpError(413, "요청이 너무 큽니다");
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "잘못된 JSON입니다");
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function handleError(error: unknown): Response {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  if (error instanceof ValidationError) return json({ error: error.message }, 400);
  console.error("api error", error instanceof Error ? error.message : "unknown");
  return json({ error: "서버 오류가 발생했습니다" }, 500);
}
