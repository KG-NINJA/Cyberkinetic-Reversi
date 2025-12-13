#!/usr/bin/env node
/**
 * ピクセル進捗SVGジェネレータ
 * - plan.md の Progress（ピクセル進捗）にある 10x10 グリッドを読み取り
 * - 「■」を塗り、「□」を未塗りとしてSVGをstdoutに出力する
 *
 * 使い方:
 *   node scripts/pixel-progress.js > progress.svg
 *
 * 注意:
 * - ここは“ゲーム要素”用。プロダクト動作には不要。
 */

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const planPath = path.join(projectRoot, "plan.md");

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function extractGrid(md) {
  // ``` の中にある [□□□...] 行を集める（最初の塊だけ採用）
  const fence = md.match(/```([\s\S]*?)```/);
  if (!fence) return null;
  const body = fence[1];
  const lines = body
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s.startsWith("[") && s.endsWith("]"));
  if (lines.length === 0) return null;
  return lines;
}

function parseGrid(lines) {
  // [■□□] の中身を配列化
  const rows = lines.map((line) => Array.from(line.slice(1, -1)));
  const h = rows.length;
  const w = rows[0].length;
  if (!rows.every((r) => r.length === w)) die("グリッドの横幅が揃っていません。");
  return { rows, w, h };
}

function ratio(grid) {
  let filled = 0;
  let total = 0;
  for (const r of grid.rows) {
    for (const ch of r) {
      if (ch !== "■" && ch !== "□") continue;
      total++;
      if (ch === "■") filled++;
    }
  }
  return total > 0 ? filled / total : 0;
}

function colorFor(p) {
  // 50%: 緑 / 80%: 金色ボーナス
  if (p >= 0.8) return "#F5C542";
  if (p >= 0.5) return "#2ECC71";
  return "#007BFF";
}

function renderSvg(grid) {
  const cell = 14;
  const gap = 4;
  const pad = 14;
  const width = pad * 2 + grid.w * cell + (grid.w - 1) * gap;
  const height = pad * 2 + grid.h * cell + (grid.h - 1) * gap + 28;
  const p = ratio(grid);
  const accent = colorFor(p);
  const percent = Math.round(p * 100);

  const parts = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
  );
  parts.push(`<rect x="0" y="0" width="${width}" height="${height}" rx="14" fill="#0B1220"/>`);
  parts.push(
    `<text x="${pad}" y="${pad + 10}" fill="#E8EEFC" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="14">Progress: ${percent}%</text>`,
  );

  const top = pad + 18;
  for (let r = 0; r < grid.h; r++) {
    for (let c = 0; c < grid.w; c++) {
      const ch = grid.rows[r][c];
      if (ch !== "■" && ch !== "□") continue;
      const x = pad + c * (cell + gap);
      const y = top + r * (cell + gap);
      const fill = ch === "■" ? accent : "rgba(255,255,255,0.10)";
      const stroke = ch === "■" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.12)";
      parts.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="4" fill="${fill}" stroke="${stroke}"/>`);
    }
  }

  // フッター
  parts.push(
    `<text x="${pad}" y="${height - 12}" fill="rgba(255,255,255,0.55)" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="12">node scripts/pixel-progress.js</text>`,
  );
  parts.push(`</svg>`);
  return parts.join("\n");
}

function main() {
  if (!fs.existsSync(planPath)) die(`plan.md が見つかりません: ${planPath}`);
  const md = fs.readFileSync(planPath, "utf8");
  const lines = extractGrid(md);
  if (!lines) die("plan.md からグリッドを抽出できませんでした（``` 内に [□□□] 行が必要）。");
  const grid = parseGrid(lines);
  process.stdout.write(renderSvg(grid));
}

main();

