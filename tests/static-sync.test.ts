import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const scripts = ["lib.js", "sync.js"].map((name) => readFileSync(new URL("../docs/" + name, import.meta.url), "utf8"));

function server() {
  const rows = new Map<string, { revision: number; snapshot: string }>();
  let onWrite: (() => Promise<void>) | undefined;
  let online = true;

  return {
    rows,
    setOnline(value: boolean) { online = value; },
    beforeNextWrite(callback: () => Promise<void>) { onWrite = callback; },
    fetch: async (_url: string, options: RequestInit) => {
      if (!online) throw new TypeError("offline");
      const { p_key: key, p_revision: revision, p_snapshot: snapshot } = JSON.parse(String(options.body));
      if (snapshot && onWrite) {
        const interrupt = onWrite;
        onWrite = undefined;
        await interrupt();
      }
      const current = rows.get(key);
      if (snapshot && (current?.revision ?? 0) === revision) {
        rows.set(key, { revision: revision + 1, snapshot });
        return Response.json({ revision: revision + 1, saved: true });
      }
      return Response.json(!current ? null : !snapshot && revision === current.revision ? { revision } : current);
    },
  };
}

function device(cloud: ReturnType<typeof server>) {
  const values = new Map<string, string>();
  const scope = vm.createContext({
    window: { ReviewNotesSyncConfig: { url: "https://example.invalid", key: "public-test-key" } },
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
    fetch: cloud.fetch, crypto, btoa, atob, TextEncoder, TextDecoder, AbortController, setTimeout, clearTimeout, DOMException,
  });
  scripts.forEach((script) => vm.runInContext(script, scope));
  const { RN, ReviewNotesSync: sync } = scope.window;
  return {
    store: RN,
    sync,
    create: (name: string) => RN.createLocal({ ...RN.emptyCampaign("2026-11-24"), business_name: name }),
    code: (): string => RN.loadLocal().sync.code,
    records: () => JSON.parse(JSON.stringify(RN.loadLocal().campaigns)),
    names: (): string[] => Array.from(RN.loadLocal().campaigns, (row: { business_name: string }) => row.business_name).sort(),
    platforms: (): string[] => Array.from(RN.loadLocal().platforms),
  };
}

test("pairing combines older device data and synchronizes changes in both directions", async () => {
  const cloud = server();
  const pc = device(cloud);
  const mobile = device(cloud);
  const pcRecord = pc.create("PC 기존 기록");
  const mobileRecord = mobile.create("휴대폰 기존 기록");
  await pc.sync.connect("");
  await mobile.sync.connect(pc.code());
  await pc.sync.sync();
  assert.deepEqual(pc.names(), ["PC 기존 기록", "휴대폰 기존 기록"]);
  assert.deepEqual(mobile.records(), pc.records());
  assert.notEqual([...cloud.rows.values()][0].snapshot, JSON.stringify(pc.records()));

  mobile.store.updateLocal(pcRecord.id, { status: "리뷰 작성 완료" });
  mobile.store.savePlatformsLocal(["레뷰", "내 체험단"]);
  await mobile.sync.sync();
  await pc.sync.sync();
  assert.equal(pc.records().find((row: { id: string }) => row.id === pcRecord.id).status, "리뷰 작성 완료");
  assert.deepEqual(pc.platforms(), ["레뷰", "내 체험단"]);

  pc.store.removeLocal(mobileRecord.id);
  await pc.sync.sync();
  await mobile.sync.sync();
  assert.deepEqual(mobile.names(), ["PC 기존 기록"]);
});

test("offline edits retry without losing records saved by a second device", async () => {
  const cloud = server();
  const pc = device(cloud);
  const mobile = device(cloud);
  await pc.sync.connect("");
  await mobile.sync.connect(pc.code());

  cloud.setOnline(false);
  pc.create("오프라인 추가");
  await assert.rejects(pc.sync.sync(), /offline/);
  assert.deepEqual(pc.names(), ["오프라인 추가"]);
  cloud.setOnline(true);

  mobile.create("휴대폰 추가");
  cloud.beforeNextWrite(() => mobile.sync.sync());
  await pc.sync.sync();
  await mobile.sync.sync();
  assert.deepEqual(pc.names(), ["오프라인 추가", "휴대폰 추가"]);
  assert.deepEqual(mobile.records(), pc.records());
});

test("edits made during a write survive and disconnect keeps this device's copy", async () => {
  const cloud = server();
  const pc = device(cloud);
  const mobile = device(cloud);
  await pc.sync.connect("");
  await mobile.sync.connect(pc.code());
  pc.create("먼저 추가");
  cloud.beforeNextWrite(async () => { pc.create("저장 도중 추가"); });
  await pc.sync.sync();
  assert.deepEqual(pc.names(), ["먼저 추가", "저장 도중 추가"]);
  await pc.sync.sync();
  await mobile.sync.sync();
  assert.deepEqual(mobile.records(), pc.records());
  pc.sync.disconnect();
  assert.deepEqual(pc.names(), mobile.names());
  assert.throws(() => pc.code());
});

test("unknown codes do not overwrite existing records or start a notebook", async () => {
  const cloud = server();
  const pc = device(cloud);
  const reference = device(cloud);
  pc.create("기존 기록");
  await reference.sync.connect("");
  const code = reference.code();
  await assert.rejects(pc.sync.connect((code[0] === "A" ? "B" : "A") + code.slice(1)), /해당하는 노트가 없어요/);
  assert.deepEqual(pc.names(), ["기존 기록"]);
  assert.equal(cloud.rows.size, 1);
});
