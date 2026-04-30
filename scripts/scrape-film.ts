import "dotenv/config";
import * as readline from "node:readline";
import { importFilm } from "./lib/importer";
import { scrapeTmdb } from "./lib/tmdb-scraper";
import { scrapeDouban } from "./lib/douban";
import { scrapeMaoyan } from "./lib/maoyan";
import type { AggregatedData } from "./lib/aggregator";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve));

async function main() {
  const query = process.argv[2];
  if (!query) {
    console.log("用法: pnpm scrape:film <影视名称>");
    process.exit(1);
  }

  console.log(`\n搜索: "${query}"\n`);

  let data: AggregatedData | null = null;
  const sources = [
    { name: "TMDB", fn: () => scrapeTmdb(query) },
    { name: "豆瓣", fn: () => scrapeDouban(query) },
    { name: "猫眼", fn: () => scrapeMaoyan(query) },
  ];

  for (const source of sources) {
    console.log(`  ${source.name} ...`);
    try {
      data = await source.fn();
      if (data) {
        console.log("  -> 获取成功");
        break;
      }
      console.log("  -> 未找到");
    } catch (e) {
      console.log(`  -> 失败: ${e instanceof Error ? e.message : ""}`);
    }
  }

  if (!data) {
    console.log("\n所有来源都没找到结果。");
    process.exit(0);
  }

  console.log(`\n------ 预览 ------`);
  console.log(`  片名: ${data.film.title}`);
  console.log(`  上映: ${data.film.releaseDate || "未知"}`);
  console.log(`  类型: ${data.film.genre || "未知"}`);
  console.log(`  时长: ${data.film.duration ? data.film.duration + " 分钟" : "未知"}`);
  console.log(`  国家: ${data.film.country || "未知"}`);
  console.log(`  简介: ${data.film.description ? data.film.description.slice(0, 120) + "..." : "无"}`);
  console.log(`  演职: ${data.artists.length} 人`);
  console.log("-------------------\n");

  const confirm = await ask("确认导入? (y/n, 默认 y): ");
  if (confirm.toLowerCase() === "n") {
    console.log("已取消。");
    process.exit(0);
  }

  console.log("\n写入数据库...");
  try {
    const result = await importFilm(data);
    if (result.isNew) {
      console.log(`导入成功! Film ID: ${result.filmId}`);
    } else {
      console.log(`影片已存在，已更新。Film ID: ${result.filmId}`);
    }
  } catch (e) {
    console.error("写入失败:", e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
