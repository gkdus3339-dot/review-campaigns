/* Encrypted device sync for the GitHub Pages app. */
(function () {
  "use strict";

  const RN = window.RN;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const storageKey = "review-notes.v1";
  const pollMilliseconds = 15000;
  const maxPayload = 6000000;
  const codePattern = /^[a-zA-Z0-9_-]{43}$/;
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const contents = ({ campaigns, platforms }) => ({ campaigns, platforms });

  function encode(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decode(text) {
    return Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0));
  }

  async function credentials(code) {
    if (!codePattern.test(code)) throw new Error("연결 코드를 다시 확인해 주세요.");
    const derive = (purpose) => crypto.subtle.digest("SHA-256", encoder.encode("review-notes/v1/" + purpose + "/" + code));
    const [access, secret] = await Promise.all([derive("access"), derive("encryption")]);
    const accessKey = Array.from(new Uint8Array(access), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const encryptionKey = await crypto.subtle.importKey("raw", secret, "AES-GCM", false, ["encrypt", "decrypt"]);
    return { accessKey, encryptionKey };
  }

  async function encrypt(data, { encryptionKey }) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = new Uint8Array(await crypto.subtle.encrypt(
      { name: "AES-GCM", iv }, encryptionKey, encoder.encode(JSON.stringify(contents(data))),
    ));
    const packed = new Uint8Array(iv.length + encrypted.length);
    packed.set(iv);
    packed.set(encrypted, iv.length);
    const payload = encode(packed);
    if (payload.length > maxPayload) throw new Error("동기화할 기록의 용량이 너무 큽니다.");
    return payload;
  }

  async function decrypt(payload, { encryptionKey }) {
    const packed = decode(payload);
    const clear = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: packed.subarray(0, 12) }, encryptionKey, packed.subarray(12),
    );
    const data = JSON.parse(decoder.decode(clear));
    if (!Array.isArray(data.campaigns) || data.campaigns.length > 5000) throw new Error("동기화 데이터를 확인해 주세요.");
    const ids = new Set();
    const campaigns = data.campaigns.map((row) => {
      if (!row || typeof row.id !== "string" || row.id.length === 0 || row.id.length > 80 || ids.has(row.id)
        || typeof row.created_at !== "string" || typeof row.updated_at !== "string") {
        throw new Error("동기화 데이터를 확인해 주세요.");
      }
      ids.add(row.id);
      return {
        id: row.id, ...RN.parseCampaign(row, false), created_at: row.created_at, updated_at: row.updated_at,
      };
    });
    return { campaigns: sortCampaigns(campaigns), platforms: RN.parsePlatforms(data) };
  }

  async function request({ accessKey }, revision, snapshot = null) {
    const config = window.ReviewNotesSyncConfig;
    if (!config) throw new Error("동기화 저장소 연결을 준비 중이에요.");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(config.url + "/rest/v1/rpc/review_notes_sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: config.key },
        body: JSON.stringify({ p_key: accessKey, p_revision: revision, p_snapshot: snapshot }),
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("동기화 저장소에 연결하지 못했어요.");
      const result = await response.json();
      if (result !== null && (!Number.isSafeInteger(result.revision) || result.revision < 1)) {
        throw new Error("동기화 저장소 응답을 확인해 주세요.");
      }
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  function sortCampaigns(campaigns) {
    return campaigns.sort((a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
  }

  function baseline(data) {
    return {
      campaigns: Object.fromEntries(data.campaigns.map((row) => [row.id, row.updated_at])),
      platforms: data.platforms,
    };
  }

  function hasChanges(data, base) {
    const ids = Object.keys(base.campaigns);
    return data.campaigns.length !== ids.length
      || data.campaigns.some((row) => base.campaigns[row.id] !== row.updated_at)
      || !equal(data.platforms, base.platforms);
  }

  function merge(local, remote, base) {
    const rows = new Map(remote.campaigns.map((row) => [row.id, row]));
    const localIds = new Set(local.campaigns.map((row) => row.id));
    if (base) {
      for (const id of Object.keys(base.campaigns)) {
        if (!localIds.has(id)) rows.delete(id);
      }
    }
    for (const row of local.campaigns) {
      const other = rows.get(row.id);
      const previous = base?.campaigns[row.id];
      if (previous !== undefined && (!other || row.updated_at === previous)) continue;
      if (!other || other.updated_at === previous || row.updated_at > other.updated_at) rows.set(row.id, row);
    }

    let platforms = remote.platforms;
    if (base) {
      if (!equal(local.platforms, base.platforms) && equal(remote.platforms, base.platforms)) platforms = local.platforms;
    } else if (!equal(local.platforms, RN.DEFAULT_PLATFORMS)) {
      platforms = equal(remote.platforms, RN.DEFAULT_PLATFORMS)
        ? local.platforms
        : [...new Set([...remote.platforms, ...local.platforms.filter((item) => !RN.DEFAULT_PLATFORMS.includes(item))])];
    }
    if (rows.size > 5000 || platforms.length > 30) throw new Error("합칠 기록이 저장 한도를 초과했어요.");
    return { campaigns: sortCampaigns([...rows.values()]), platforms };
  }

  function commit(data, sync) {
    localStorage.setItem(storageKey, JSON.stringify({ ...contents(data), sync }));
  }

  function applyRemote(code, revision, agreed, before) {
    const latest = RN.loadLocal();
    if (latest.sync && (latest.sync.code !== code || latest.sync.revision > revision)) return;
    if (before.sync && !latest.sync) return;
    // Preserve edits made while a network request or encryption was in flight.
    const next = merge(latest, agreed, baseline(before));
    commit(next, { code, revision, base: baseline(agreed) });
  }

  async function connect(inputCode) {
    const code = inputCode ? inputCode.trim() : encode(crypto.getRandomValues(new Uint8Array(32)));
    const keys = await credentials(code);
    const before = RN.loadLocal();
    if (before.sync) throw new Error("이미 연결된 기기예요.");
    if (!inputCode) {
      const agreed = contents(before);
      const result = await request(keys, 0, await encrypt(agreed, keys));
      if (!result?.saved) throw new Error("새 연결을 만들지 못했어요. 다시 시도해 주세요.");
      applyRemote(code, result.revision, agreed, before);
      return;
    }

    let remote = await request(keys, 0);
    for (let attempt = 0; attempt < 4; attempt++) {
      if (!remote?.snapshot) throw new Error("연결 코드에 해당하는 노트가 없어요.");
      const cloud = await decrypt(remote.snapshot, keys);
      const latest = RN.loadLocal();
      if (latest.sync) throw new Error("이미 연결된 기기예요.");
      const agreed = merge(latest, cloud);
      if (equal(agreed, cloud)) {
        applyRemote(code, remote.revision, cloud, latest);
        return;
      }
      remote = await request(keys, remote.revision, await encrypt(agreed, keys));
      if (remote?.saved) {
        applyRemote(code, remote.revision, agreed, latest);
        return;
      }
    }
    throw new Error("다른 기기에서 저장 중이에요. 잠시 뒤 다시 시도해 주세요.");
  }

  async function sync() {
    const initial = RN.loadLocal().sync;
    if (!initial) return;
    const keys = await credentials(initial.code);
    let remote = await request(keys, initial.revision);
    for (let attempt = 0; attempt < 4; attempt++) {
      if (!remote) throw new Error("연결된 노트를 찾지 못했어요.");
      const cloud = remote.snapshot ? await decrypt(remote.snapshot, keys) : null;
      const before = RN.loadLocal();
      const link = before.sync;
      if (!link || link.code !== initial.code || link.revision > remote.revision) return;
      const agreed = cloud ? merge(before, cloud, link.base) : contents(before);
      const shouldSave = cloud ? !equal(agreed, cloud) : hasChanges(before, link.base);
      if (!shouldSave) {
        if (cloud) applyRemote(link.code, remote.revision, cloud, before);
        return;
      }
      remote = await request(keys, remote.revision, await encrypt(agreed, keys));
      if (remote?.saved) {
        applyRemote(link.code, remote.revision, agreed, before);
        return;
      }
    }
    throw new Error("다른 기기에서 저장 중이에요. 잠시 뒤 다시 시도해 주세요.");
  }

  function disconnect() {
    commit(RN.loadLocal(), undefined);
  }

  window.ReviewNotesSync = { connect, sync, disconnect, storageKey, pollMilliseconds };
})();
