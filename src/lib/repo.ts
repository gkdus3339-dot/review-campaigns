import "server-only";
import { sql } from "./db";
import { Campaign, CampaignInput, DEFAULT_PLATFORMS } from "./types";
import { CAMPAIGN_FIELDS } from "./validate";

const MAX_CAMPAIGNS_PER_OWNER = 5000;

const COLUMNS = `id, ${CAMPAIGN_FIELDS.join(", ")}, created_at::text as created_at, updated_at::text as updated_at`;

export async function listCampaigns(owner: string): Promise<Campaign[]> {
  return sql<Campaign>(`select ${COLUMNS} from campaigns where owner = $1 order by created_at desc`, [owner]);
}

export async function getCampaign(owner: string, id: string): Promise<Campaign | null> {
  const rows = await sql<Campaign>(`select ${COLUMNS} from campaigns where owner = $1 and id = $2`, [owner, id]);
  return rows[0] ?? null;
}

export async function createCampaign(owner: string, input: Partial<CampaignInput>): Promise<Campaign | "limit"> {
  const [{ count }] = await sql<{ count: number }>("select count(*)::int as count from campaigns where owner = $1", [
    owner,
  ]);
  if (count >= MAX_CAMPAIGNS_PER_OWNER) return "limit";
  const fields = CAMPAIGN_FIELDS.filter((f) => f in input);
  const placeholders = fields.map((_, i) => `$${i + 2}`);
  const rows = await sql<Campaign>(
    `insert into campaigns (owner, ${fields.join(", ")}) values ($1, ${placeholders.join(", ")}) returning ${COLUMNS}`,
    [owner, ...fields.map((f) => input[f])],
  );
  return rows[0];
}

export async function updateCampaign(
  owner: string,
  id: string,
  input: Partial<CampaignInput>,
): Promise<Campaign | null> {
  const fields = CAMPAIGN_FIELDS.filter((f) => f in input);
  if (fields.length === 0) return getCampaign(owner, id);
  const sets = fields.map((f, i) => `${f} = $${i + 3}`);
  const rows = await sql<Campaign>(
    `update campaigns set ${sets.join(", ")}, updated_at = now() where owner = $1 and id = $2 returning ${COLUMNS}`,
    [owner, id, ...fields.map((f) => input[f])],
  );
  return rows[0] ?? null;
}

export async function deleteCampaign(owner: string, id: string): Promise<boolean> {
  const rows = await sql("delete from campaigns where owner = $1 and id = $2 returning id", [owner, id]);
  return rows.length > 0;
}

export async function getPlatforms(owner: string): Promise<string[]> {
  const rows = await sql<{ platforms: string[] }>("select platforms from user_settings where owner = $1", [owner]);
  return rows[0]?.platforms ?? DEFAULT_PLATFORMS;
}

export async function setPlatforms(owner: string, platforms: string[]): Promise<string[]> {
  await sql(
    `insert into user_settings (owner, platforms) values ($1, $2::jsonb)
     on conflict (owner) do update set platforms = excluded.platforms, updated_at = now()`,
    [owner, JSON.stringify(platforms)],
  );
  return platforms;
}
