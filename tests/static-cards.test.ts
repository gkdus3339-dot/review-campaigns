import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

import type { Campaign } from "../src/lib/types";

const scripts = ["lib.js", "app.js"].map((file) =>
  readFileSync(new URL("../docs/" + file, import.meta.url), "utf8"),
);

function renderCards(hash: string, dates: Partial<Campaign>[]) {
  const view = { innerHTML: "" };
  const elements: Record<string, { innerHTML: string }> = {
    view, nav: { innerHTML: "" }, "toast-root": { innerHTML: "" },
  };
  const browser = vm.createContext({
    window: { addEventListener() {}, scrollTo() {} },
    document: { getElementById: (id: string) => elements[id], addEventListener() {} },
    location: { hash },
    URLSearchParams,
  });
  vm.runInContext(scripts[0], browser);
  const store = browser.window.RN;
  store.todayISO = () => "2026-11-24";
  store.loadLocal = () => ({
    platforms: store.DEFAULT_PLATFORMS,
    campaigns: dates.map((dateFields, index) => ({
      ...store.emptyCampaign("2026-11-24"),
      id: "campaign-" + index,
      business_name: "체험단 " + index,
      created_at: "2026-11-24T00:00:00Z",
      updated_at: "2026-11-24T00:00:00Z",
      ...dateFields,
    })),
  });
  vm.runInContext(scripts[1], browser);
  return [...view.innerHTML.matchAll(/<a class="cc-main" href="#\/c\/([^"]+)">([\s\S]*?)<\/a>/g)];
}

test("home and list show one card per campaign even when the dates fall in different sections", () => {
  const dates = [
    { visit_date: "2026-11-23", deadline: "2026-11-27" },
    { visit_date: "2026-11-25", deadline: "2026-11-30" },
  ];

  for (const route of ["#/", "#/list"]) {
    const cards = renderCards(route, dates);
    assert.deepEqual(cards.map((card) => card[1]), ["campaign-0", "campaign-1"]);
    for (const [, , contents] of cards) {
      assert.match(contents, /cc-event k-visit/);
      assert.match(contents, /cc-event k-deadline/);
    }
  }
});

test("calendar cards combine two events on the same day or in the remaining month", () => {
  const today = renderCards("#/calendar", [{
    visit_date: "2026-11-24", deadline: "2026-11-24", status: "방문 완료",
  }]);
  assert.equal(today.length, 1);
  assert.match(today[0][2], /k-visit[\s\S]*?완료/);
  assert.match(today[0][2], /cc-event k-deadline/);

  const month = renderCards("#/calendar", [{ visit_date: "2026-11-25", deadline: "2026-11-30" }]);
  assert.equal(month.length, 1);
  assert.match(month[0][2], /cc-event k-visit[\s\S]*?cc-event k-deadline/);
});
