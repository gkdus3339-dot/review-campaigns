import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "src/lib/dates.ts",
  "src/lib/types.ts",
  "src/lib/money.ts",
  "src/lib/fields.ts",
  "src/lib/validate.ts",
  "src/lib/store.ts",
  "src/lib/events.ts",
  "src/lib/stats.ts",
  "src/lib/parser.ts",
];

const parts = [];
for (const file of files) {
  const src = fs.readFileSync(`${root}/${file}`, "utf8");
  let out = ts.transpileModule(src, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    fileName: file,
  }).outputText;
  out = out
    .replace(/^\s*import\s+[\s\S]*?;\s*$/gm, "")
    .replace(/^\s*export\s*\{[^}]*\}\s*;\s*$/gm, "")
    .replace(/^export\s+(?=function|const|class|let|var|async)/gm, "");
  parts.push(`/* ${file} */\n${out.trim()}\n`);
}

const names = [
  "STATUSES",
  "FLOW_STATUSES",
  "CATEGORIES",
  "DEFAULT_PLATFORMS",
  "emptyCampaign",
  "needsReview",
  "needsVisit",
  "isReviewDone",
  "isSafeUrl",
  "pad",
  "toISO",
  "todayISO",
  "parseISO",
  "isValidISO",
  "diffDays",
  "dDayLabel",
  "formatShort",
  "formatRange",
  "monthKey",
  "monthLabel",
  "addMonths",
  "WEEKDAYS",
  "formatWon",
  "formatManwon",
  "CAMPAIGN_FIELDS",
  "ValidationError",
  "parseCampaign",
  "parsePlatforms",
  "loadLocal",
  "createLocal",
  "updateLocal",
  "removeLocal",
  "savePlatformsLocal",
  "campaignEvents",
  "EVENT_LABEL",
  "upcomingEvents",
  "savingsMonth",
  "monthlySavings",
  "recentMonths",
  "yearSummary",
  "parseWinMessage",
];

let body = parts.join("\n");
body = body.replace(/crypto\.randomUUID\(\)/g, "__uuid()");

const js = `/* Generated from src/lib. Same rules as the Next.js app. */
(function (root) {
"use strict";
function __uuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 3 | 8)).toString(16);
  });
}
${body}
root.RN = {
${names.map((n) => `  ${n}: ${n},`).join("\n")}
};
})(typeof window !== "undefined" ? window : globalThis);
`;

if (/\bimport\b/.test(body) || /\bexport\b/.test(body)) {
  const hit = body.split("\n").filter((line) => /\b(import|export)\b/.test(line)).slice(0, 20);
  console.error(hit.join("\n"));
  throw new Error("bundle still has import/export");
}

fs.writeFileSync(`${root}/docs/lib.js`, js);
console.log("wrote docs/lib.js", js.length);
