function parseRssItems(xml: string, limit = 4) {
  const items: Array<{ title: string; link: string; pubDate: string; source: string }> = [];
  const pattern = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = pattern.exec(xml)) !== null) {
    if (items.length >= limit) break;
    const c = match[1];

    const titleRaw =
      c.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
      c.match(/<title>([\s\S]*?)<\/title>/)?.[1] ??
      '';
    const title = titleRaw.trim();

    // Google News puts the real article URL in <description> as an href
    let link = '';
    const descRaw =
      c.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ??
      c.match(/<description>([\s\S]*?)<\/description>/)?.[1] ??
      '';
    const hrefMatch = descRaw.match(/href="(https?:\/\/[^"]+)"/);
    if (hrefMatch) {
      link = hrefMatch[1];
    } else {
      const guidRaw = c.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]?.trim() ?? '';
      link = guidRaw.startsWith('http')
        ? guidRaw
        : guidRaw
        ? `https://news.google.com/articles/${guidRaw}`
        : '';
    }

    const pubDate =
      c.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? '';
    const source =
      c.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() ?? '';

    if (title.length > 5) items.push({ title, link, pubDate, source });
  }
  return items;
}

const NEWS_FEEDS = [
  {
    category: 'colombia-economia',
    label: 'Economía Colombia',
    url: 'https://news.google.com/rss/search?q=economia+colombia+DIAN+impuestos+banco+republica&hl=es-419&gl=CO&ceid=CO:es',
  },
  {
    category: 'mundial',
    label: 'Economía Mundial',
    url: 'https://news.google.com/rss/search?q=economia+mundial+mercados+financieros+finanzas&hl=es-419&gl=CO&ceid=CO:es',
  },
  {
    category: 'juridico',
    label: 'Jurídico Colombia',
    url: 'https://news.google.com/rss/search?q=reforma+tributaria+colombia+derecho+abogados+legislacion+DIAN&hl=es-419&gl=CO&ceid=CO:es',
  },
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; 9AlliancePortal/1.0)',
  Accept: 'application/rss+xml, application/xml, text/xml, */*',
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 5-minute Vercel edge cache; up to 10-min stale-while-revalidate
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const [rateResult, ...newsResults] = await Promise.allSettled([
    fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(6000),
    }),
    ...NEWS_FEEDS.map(f =>
      fetch(f.url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(7000),
      })
    ),
  ]);

  // ── Exchange rate ──────────────────────────────────────────────────────────
  let usdCop: number | null = null;
  let eurCop: number | null = null;
  const updatedAt = new Date().toISOString();

  if (rateResult.status === 'fulfilled' && rateResult.value.ok) {
    const data = await rateResult.value.json().catch(() => null);
    if (data?.rates?.COP) {
      usdCop = Math.round(data.rates.COP * 100) / 100;
      if (data.rates.EUR && data.rates.EUR > 0) {
        eurCop = Math.round((data.rates.COP / data.rates.EUR) * 100) / 100;
      }
    }
  }

  // ── News ───────────────────────────────────────────────────────────────────
  const news = await Promise.all(
    newsResults.map(async (result, i) => {
      const feed = NEWS_FEEDS[i];
      if (result.status !== 'fulfilled' || !result.value.ok) {
        return { ...feed, items: [] };
      }
      const xml = await result.value.text().catch(() => '');
      return { ...feed, items: parseRssItems(xml, 4) };
    })
  );

  return res.status(200).json({ exchange: { usdCop, eurCop, updatedAt }, news });
}
