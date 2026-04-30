import { chromium } from "playwright";
import type { AggregatedData } from "./aggregator";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function scrapeMaoyan(query: string): Promise<AggregatedData | null> {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.HTTPS_PROXY || process.env.HTTP_PROXY
      ? { proxy: { server: (process.env.HTTPS_PROXY || process.env.HTTP_PROXY)! } }
      : {}),
  });
  try {
    const context = await browser.newContext({ userAgent: USER_AGENT });
    const page = await context.newPage();

    const searchUrl = `https://maoyan.com/query?kw=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    const firstLink = page.locator(".movie-list .movie-item a").first();
    const hasResults = await firstLink.count();
    if (hasResults === 0) {
      return null;
    }

    await firstLink.click();
    await page.waitForURL(/maoyan\.com\/films\/\d+/, { timeout: 15000 });

    const title =
      (await page.locator(".movie-brief-container .name").textContent()) || query;
    const cleanTitle = title.replace(/\s+/g, " ").trim();

    const coverEl = page.locator(".avatar-shadow img");
    const cover = (await coverEl.getAttribute("src")) || null;

    const releaseDateText =
      await page.locator(".movie-brief-container .ellipsis").last().textContent();
    const releaseDate = releaseDateText
      ? releaseDateText.match(/\d{4}-\d{2}-\d{2}/)?.[0] || null
      : null;

    const genreText =
      await page.locator(".movie-brief-container .text-link").first().textContent();
    const genre = genreText?.trim() || null;

    const durationMatch =
      (await page.locator(".movie-brief-container .ellipsis").first().textContent())?.match(/(\d+)\s*分钟/);
    const duration = durationMatch ? parseInt(durationMatch[1], 10) : null;

    const description =
      await page.locator(".mod-content .dra.elm").first().textContent();
    const cleanDesc = description?.replace(/\s+/g, " ").trim() || null;

    const artists: AggregatedData["artists"] = [];
    const celebrityItems = page.locator(".celebrity-container .celebrity-group .celebrity-type");
    const count = await celebrityItems.count();

    for (let i = 0; i < count && artists.length < 11; i++) {
      const roleType = await celebrityItems.nth(i).locator(".type-title").textContent();
      const names = await celebrityItems.nth(i).locator(".celebrity-list .name").allTextContents();
      const category = roleType?.includes("导演") ? "DIRECTOR" : "ACTOR";
      const role = roleType?.includes("导演") ? "DIRECTOR" : "ACTOR";
      for (const name of names.slice(0, roleType?.includes("导演") ? 1 : 10)) {
        if (artists.length >= 11) break;
        if (!artists.find((a) => a.name === name.trim() && a.category === category)) {
          artists.push({
            name: name.trim(),
            avatar: null,
            category,
            role,
            characterName: null,
          });
        }
      }
    }

    return {
      film: {
        title: cleanTitle,
        cover,
        releaseDate,
        genre,
        duration,
        country: null,
        description: cleanDesc,
        type: "MOVIE",
      },
      artists,
    };
  } catch {
    return null;
  } finally {
    await browser.close();
  }
}
