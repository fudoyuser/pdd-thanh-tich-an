// Dựng history.json từ lịch sử git của index.html:
// mỗi ngày (giờ Việt Nam) giữ bản FIELDS của lần chỉnh sửa cuối cùng trong ngày.
// Chạy: node tools/build-history.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 << 20 });
const vnDate = ts => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(ts * 1000));

const commits = git("log", "--reverse", "--format=%H %ct", "--", "index.html")
  .trim().split("\n").filter(Boolean).map(l => l.split(" "));

const byDay = new Map();
for (const [hash, ts] of commits) {
  const src = git("show", `${hash}:index.html`);
  const m = src.match(/const FIELDS = (\[[\s\S]*?\n  \]);/);
  if (!m) continue;
  try {
    byDay.set(vnDate(Number(ts)), new Function(`return ${m[1]}`)());
  } catch (e) {
    console.warn(`Bỏ qua ${hash.slice(0, 7)}: ${e.message}`);
  }
}

const days = [...byDay].map(([date, fields]) => ({ date, fields }));
writeFileSync("history.json", JSON.stringify({ days }) + "\n");
console.log(`history.json: ${days.length} ngày (${days[0]?.date} → ${days.at(-1)?.date})`);
