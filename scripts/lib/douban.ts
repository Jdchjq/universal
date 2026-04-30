import { chromium } from "playwright";
import type { AggregatedData } from "./aggregator";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function launchBrowser() {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  return chromium.launch({
    headless: true,
    ...(proxy ? { proxy: { server: proxy } } : {}),
  });
}

export async function scrapeDouban(query: string): Promise<AggregatedData | null> {
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({ userAgent: USER_AGENT });
    const page = await context.newPage();

    const searchUrl = `https://search.douban.com/movie/subject_search?search_text=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    const firstLink = page.locator(".sc-bZQynM.jDbGHE .title a, .result-list .item a").first();
    const hasResults = await firstLink.count();
    if (hasResults === 0) {
      return null;
    }

    await firstLink.click();
    await page.waitForURL(/douban\.com\/subject\/\d+/, { timeout: 15000 });

    const title =
      (await page.locator('span[property="v:itemreviewed"]').textContent()) ||
      (await page.locator("#content h1").first().textContent()) ||
      query;
    const cleanTitle = title.replace(/\s+/g, " ").trim();

    const coverEl = page.locator("#mainpic img");
    const cover = (await coverEl.getAttribute("src")) || null;

    const releaseDate =
      (await page.locator('span[property="v:initialReleaseDate"]').first().textContent()) || null;

    let genre: string | null = null;
    const genreEls = page.locator('span[property="v:genre"]');
    const genreCount = await genreEls.count();
    if (genreCount > 0) {
      const genres: string[] = [];
      for (let i = 0; i < genreCount; i++) {
        const text = await genreEls.nth(i).textContent();
        if (text) genres.push(text.trim());
      }
      genre = genres.join("、");
    }

    const runtimeText =
      (await page.locator('span[property="v:runtime"]').first().textContent()) || null;
    const duration = runtimeText ? parseInt(runtimeText, 10) : null;

    const country = await page
      .locator("#info")
      .textContent()
      .then((t) => {
        if (!t) return null;
        const match = t.match(/制片国家\/地区:\s*(.+)/);
        return match ? match[1].trim() : null;
      });

    const description =
      (await page.locator('span[property="v:summary"]').first().textContent()) || null;
    const cleanDesc = description?.replace(/\s+/g, " ").trim() || null;

    const directors = await page.locator('a[rel="v:directedBy"]').allTextContents();
    const actors = await page.locator('a[rel="v:starring"]').allTextContents();

    const artists: AggregatedData["artists"] = [];
    for (const name of directors.slice(0, 1)) {
      artists.push({ name: name.trim(), avatar: null, category: "DIRECTOR", role: "DIRECTOR", characterName: null });
    }
    const seen = new Set(directors.map((d) => `${d.trim()}|ACTOR`));
    for (const name of actors.slice(0, 10)) {
      const key = `${name.trim()}|ACTOR`;
      if (!seen.has(key)) {
        seen.add(key);
        artists.push({ name: name.trim(), avatar: null, category: "ACTOR", role: "ACTOR", characterName: null });
      }
    }

    return {
      film: {
        title: cleanTitle,
        cover,
        releaseDate: releaseDate?.trim() || null,
        genre,
        duration,
        country,
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
