import { chromium } from "playwright";
import type { AggregatedData } from "./aggregator";
import { getMovieCredits, buildImageUrl } from "../../src/services/tmdb";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const TMDB_BASE = "https://www.themoviedb.org";

function launchBrowser() {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  console.log(`  [tmdb] 代理: ${proxy || "无"}`);
  return chromium.launch({
    headless: true,
    ...(proxy ? { proxy: { server: proxy } } : {}),
  });
}

export async function scrapeTmdb(query: string): Promise<AggregatedData | null> {
  console.log(`  [tmdb] 启动浏览器...`);
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({ userAgent: USER_AGENT });
    const page = await context.newPage();

    const searchUrl = `${TMDB_BASE}/search?query=${encodeURIComponent(query)}`;
    console.log(`  [tmdb] 打开搜索页: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 30000 });

    const resultContainer = page.locator(".search_results.movie");
    const containerCount = await resultContainer.count();
    console.log(`  [tmdb] search_results.movie: ${containerCount}`);

    let detailPath: string | null = null;
    let movieTitle = "";

    if (containerCount > 0) {
      const resultLinks = resultContainer.locator('a[href*="/movie/"]');
      const linkCount = await resultLinks.count();
      console.log(`  [tmdb] 结果链接数: ${linkCount}`);

      for (let i = 0; i < linkCount; i++) {
        const link = resultLinks.nth(i);
        const text = (await link.textContent())?.trim() || "";
        if (text.length > 1 && !/now playing|popular|top rated|upcoming/i.test(text)) {
          const href = await link.getAttribute("href");
          if (href && href.match(/\/movie\/\d+/)) {
            detailPath = href;
            movieTitle = text;
            break;
          }
        }
      }

      if (!detailPath) {
        for (let i = 0; i < linkCount; i++) {
          const href = await resultLinks.nth(i).getAttribute("href");
          if (href && href.match(/\/movie\/\d+/)) {
            detailPath = href;
            movieTitle = (await resultLinks.nth(i).textContent())?.trim() || "";
            break;
          }
        }
      }
    }

    if (!detailPath) {
      console.log(`  [tmdb] 搜索无结果`);
      return null;
    }

    console.log(`  [tmdb] 选中: "${movieTitle}" -> ${detailPath}`);

    // 详情页，指定中文
    const separator = detailPath.includes("?") ? "&" : "?";
    const fullDetailUrl = `${TMDB_BASE}${detailPath}${separator}language=zh-CN`;
    console.log(`  [tmdb] 打开详情页: ${fullDetailUrl}`);
    await page.goto(fullDetailUrl, { waitUntil: "networkidle", timeout: 30000 });
    console.log(`  [tmdb] 详情页 URL: ${page.url()}`);

    // 标题
    let title =
      (await page.locator(".title h2 a").first().textContent()) ||
      (await page.locator('h2 a[href*="/movie/"]').first().textContent()) ||
      "";
    title = title.trim() || movieTitle || query;
    console.log(`  [tmdb] 标题: "${title}"`);

    const cover = (await page.locator("img.poster").first().getAttribute("src")) || null;
    console.log(`  [tmdb] 封面: ${cover?.slice(0, 80) || "无"}`);

    const description = (await page.locator(".overview p").first().textContent()) || null;
    console.log(`  [tmdb] 简介: ${description ? description.slice(0, 60) + "..." : "无"}`);

    // --- facts 解析：逐个子元素提取，而非正则匹配整段文本 ---
    const factsContainer = page.locator(".facts").first();
    const factChunks = factsContainer.locator("> *");
    const chunkCount = await factChunks.count();
    const factsTexts: string[] = [];
    for (let i = 0; i < chunkCount; i++) {
      const t = (await factChunks.nth(i).textContent())?.trim();
      if (t) factsTexts.push(t);
    }
    console.log(`  [tmdb] facts chunks (${chunkCount}):`, factsTexts.map((s) => s.slice(0, 60)));

    let releaseDate: string | null = null;
    let country: string | null = null;
    let duration: number | null = null;

    for (const chunk of factsTexts) {
      // 上映日期 + 地区: "07/16/2010 (US)" 或 "2010-07-16 (US)"
      const releaseAndCountry = chunk.match(
        /(\d{2,4}[-/]\d{2,4}[-/]\d{2,4})\s*\((\w{2})\)/
      );
      if (releaseAndCountry) {
        // 统一转成 YYYY-MM-DD
        const parts = releaseAndCountry[1].split(/[-\/]/);
        if (parts[0].length === 4) {
          releaseDate = parts.join("-");
        } else {
          releaseDate = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
        }
        country = releaseAndCountry[2];
        continue;
      }

      // 纯日期: "07/16/2010" 或 "2010-07-16"
      const releaseOnly = chunk.match(/(\d{2,4}[-/]\d{2,4}[-/]\d{2,4})/);
      if (releaseOnly && !chunk.match(/^\d+h\s*\d*m/i) && !chunk.match(/^\d+\s*(分钟|min|m)/i)) {
        const parts = releaseOnly[1].split(/[-\/]/);
        releaseDate =
          parts[0].length === 4
            ? parts.join("-")
            : `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
        continue;
      }

      // 时长: "2h 28m" 或 "148分钟"
      const hmMatch = chunk.match(/(\d+)h\s*(\d+)m/);
      if (hmMatch) {
        duration = parseInt(hmMatch[1]) * 60 + parseInt(hmMatch[2]);
        continue;
      }
      const mOnly = chunk.match(/(\d+)\s*(?:分钟|min|m)/);
      if (mOnly) {
        duration = parseInt(mOnly[1]);
        continue;
      }
    }

    // 如果没有从 country code 获取到，查 production_countries
    if (!country) {
      const countryEl = page.locator('a[href*="/country/"]').first();
      const countryCount = await countryEl.count();
      if (countryCount > 0) {
        country = (await countryEl.textContent())?.trim() || null;
      }
    }

    console.log(`  [tmdb] 上映: ${releaseDate || "未提取到"} | 地区: ${country || "未提取到"} | 时长: ${duration ? duration + "分钟" : "未提取到"}`);

    // 类型
    const genreEls = page.locator(".genres a");
    const genreCount = await genreEls.count();
    const genres: string[] = [];
    for (let i = 0; i < genreCount; i++) {
      const t = await genreEls.nth(i).textContent();
      if (t) genres.push(t.trim());
    }
    const genre = genres.length > 0 ? genres.join("、") : null;
    console.log(`  [tmdb] 类型: ${genre || "无"}`);

    // ─── 演职人员 ───────────────────────────────────────────────
    const artists: AggregatedData["artists"] = [];
    const personUrlMap = new Map<string, string>(); // name → /person/xxx
    const seen = new Set<string>();
    let sortOrder = 0;

    const movieIdMatch = detailPath.match(/\/movie\/(\d+)/);
    const movieId = movieIdMatch ? parseInt(movieIdMatch[1]) : null;
    console.log(`  [tmdb] 电影 ID: ${movieId || "未识别"}`);

    // helper: 添加艺人（去重），sortOrder 自增
    const pushArtist = (name: string, category: string, role: string, characterName: string | null, avatar?: string | null, englishName?: string) => {
      const key = `${name.trim()}|${category}`;
      if (seen.has(key)) return null;
      seen.add(key);
      const a = { name: name.trim(), avatar: avatar || null, category, role, characterName, englishName, sortOrder: sortOrder++ };
      artists.push(a);
      return a;
    };

    // ── 1) HTML 解析（先执行，作为 sortOrder 的权威来源）──────

    // 1a) ol.people.no_image li.profile — 导演/剧组（不带图片的列表）
    const noImgItems = page.locator("ol.people.no_image li.profile");
    const noImgCount = await noImgItems.count();
    console.log(`  [tmdb] people.no_image: ${noImgCount} 人`);

    for (let i = 0; i < noImgCount; i++) {
      const item = noImgItems.nth(i);
      const nameEl = item.locator("p a").first();
      const name = await nameEl.textContent().catch(() => "");
      const character = await item.locator("p.character").first().textContent().catch(() => "");
      if (!name) continue;

      const href = await nameEl.getAttribute("href").catch(() => "");
      if (href) personUrlMap.set(name.trim(), href);

      const roleText = character?.trim() || "";
      const isDirector = /导演|Director/i.test(roleText);
      const category = isDirector ? "DIRECTOR" : "CREW";
      const filmRole = isDirector ? "DIRECTOR" : roleText.split(",")[0].trim();

      pushArtist(name, category, filmRole, roleText || null);
    }

    // 1b) ol.people.scroller li.card — 演员（带头像卡片）
    const cards = page.locator("ol.people.scroller li.card:not(.filler)");
    const cardCount = await cards.count();
    console.log(`  [tmdb] people.scroller li.card: ${cardCount} 人`);

    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const imgEl = card.locator("img.profile").first();
      const cardImg = await imgEl.getAttribute("src").catch(() => "");
      const nameEl = card.locator("p a").first();
      const name = await nameEl.textContent().catch(() => "");
      const character = await card.locator("p.character").first().textContent().catch(() => "");
      if (!name) continue;

      const href = await nameEl.getAttribute("href").catch(() => "");
      if (href) personUrlMap.set(name.trim(), href);

      pushArtist(name, "ACTOR", "ACTOR", character?.trim() || null, cardImg || null);
    }

    // ── 2) TMDB API（补充头像/英文名/角色名 + 填补 HTML 遗漏）──
    let apiSuccess = false;
    if (movieId) {
      try {
        const credits = await getMovieCredits(movieId);
        for (const person of credits.crew) {
          if (person.job === "Director") {
            const isEnglishDiff = person.original_name && person.original_name !== person.name;
            const existing = artists.find((a) => a.name === person.name && a.category === "DIRECTOR");
            if (existing) {
              if (!existing.avatar && person.profile_path) {
                existing.avatar = buildImageUrl(person.profile_path, "w185");
              }
              if (!existing.englishName && isEnglishDiff) {
                existing.englishName = person.original_name;
              }
            } else {
              pushArtist(person.name, "DIRECTOR", "DIRECTOR", null, person.profile_path ? buildImageUrl(person.profile_path, "w185") : null, isEnglishDiff ? person.original_name : undefined);
            }
          }
        }
        for (const person of credits.cast.slice(0, 10)) {
          const isEnglishDiff = person.original_name && person.original_name !== person.name;
          const existing = artists.find((a) => a.name === person.name && a.category === "ACTOR");
          if (existing) {
            if (!existing.avatar && person.profile_path) {
              existing.avatar = buildImageUrl(person.profile_path, "w185");
            }
            if (!existing.englishName && isEnglishDiff) {
              existing.englishName = person.original_name;
            }
            if (!existing.characterName && person.character) {
              existing.characterName = person.character;
            }
          } else {
            pushArtist(person.name, "ACTOR", "ACTOR", person.character || null, person.profile_path ? buildImageUrl(person.profile_path, "w185") : null, isEnglishDiff ? person.original_name : undefined);
          }
        }
        apiSuccess = true;
        console.log(`  [tmdb] API 补充演职人员完成`);
      } catch (e) {
        console.log(`  [tmdb] API 失败: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (!apiSuccess && artists.length === 0) {
      const fallbackEls = page.locator("ol.cast_list li, .cast_list tr");
      const fallbackCount = await fallbackEls.count();
      for (let i = 0; i < fallbackCount && artists.length < 11; i++) {
        const el = fallbackEls.nth(i);
        const name = await el.locator("p a, a").first().textContent().catch(() => "");
        if (name) pushArtist(name, "ACTOR", "ACTOR", null);
      }
    }
    console.log(`  [tmdb] 合并后演职人员: ${artists.length} 人 (API:${apiSuccess ? "✓" : "✗"} personUrl:${personUrlMap.size})`);

    // ── 3) 爬取人员详情页（丰富头像/英文名/bio/作品）───────────
    const peopleToScrape = artists
      .filter((a) => a.category !== "ACTOR" || !a.avatar)
      .slice(0, 10);

    let personScraped = 0;
    for (const artist of peopleToScrape) {
      const personPath = personUrlMap.get(artist.name);
      if (!personPath) continue;

      try {
        const personPage = await context.newPage();
        await personPage.goto(`${TMDB_BASE}${personPath}?language=zh-CN`, { waitUntil: "domcontentloaded", timeout: 15000 });

        // 头像（人员详情页的高清图优先）
        const personImg = await personPage.locator("img.profile").first().getAttribute("src").catch(() => "");
        if (personImg) {
          artist.avatar = personImg.startsWith("http") ? personImg : `https:${personImg}`;
        }

        // 英文名 / Also Known As
        if (!artist.englishName) {
          const akaText = await personPage.locator("section:has(h3:has-text('Also Known As')), .also_known_as, p:has(strong:has-text('Also Known As'))").first().textContent().catch(() => "");
          if (akaText) {
            const m = akaText.match(/Also Known As[:\s]*(.+)/i);
            if (m) artist.englishName = m[1].trim();
          }
        }

        // 生日 + 出生地
        if (!artist.bio) {
          const birthday = await personPage.locator("span:has-text('Birthday'), p:has(strong:has-text('Birthday'))").first().textContent().catch(() => "");
          const birthplace = await personPage.locator("span:has-text('Place of Birth'), p:has(strong:has-text('Place of Birth'))").first().textContent().catch(() => "");
          const parts: string[] = [];
          if (birthday) parts.push(birthday.replace(/Birthday[:\s]*/i, "").trim());
          if (birthplace) parts.push(birthplace.replace(/Place of Birth[:\s]*/i, "").trim());
          if (parts.length > 0) artist.bio = parts.join(" · ");
        }

        // 作品列表
        if (!artist.filmography) {
          const kfCards = personPage.locator(".known_for .card, section.known_for a[href*='/movie/'], section.known_for a[href*='/tv/']");
          const kfCount = await kfCards.count().catch(() => 0);
          if (kfCount > 0) {
            artist.filmography = [];
            for (let k = 0; k < Math.min(kfCount, 8); k++) {
              const c = kfCards.nth(k);
              const fTitle = await c.locator("a").first().textContent().catch(() => "");
              const fHref = await c.locator("a").first().getAttribute("href").catch(() => "");
              const fYear = await c.locator(".year, span.year, p.year").textContent().catch(() => "");
              if (fTitle?.trim()) {
                artist.filmography!.push({ title: fTitle.trim(), year: (fYear || "").trim(), role: artist.role, mediaType: fHref?.includes("/tv/") ? "tv" : "movie" });
              }
            }
          }
        }

        await personPage.close();
        personScraped++;
        console.log(`  [tmdb] 人员: ${artist.name} 头像:${artist.avatar ? "✓" : "✗"} 英文:${artist.englishName || "-"} 作品:${artist.filmography?.length || 0}`);
      } catch {
        // 人员详情页失败不阻塞
      }
    }
    console.log(`  [tmdb] 人员详情爬取: ${personScraped}/${peopleToScrape.length}`);

    return {
      film: {
        title,
        cover,
        releaseDate,
        genre,
        duration,
        country,
        description: description?.trim() || null,
        type: "MOVIE",
      },
      artists,
    };
  } catch (e) {
    console.log(`  [tmdb] 异常: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  } finally {
    await browser.close();
  }
}
