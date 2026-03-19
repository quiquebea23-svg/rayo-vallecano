export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800'); // 30 min cache

  const parseRSS = (xml) => {
    const items = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let m;
    while ((m = itemRegex.exec(xml)) !== null) {
      const item = m[1];
      const get = (tag) => {
        const cdataMatch = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
        const plainMatch = item.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'));
        return (cdataMatch?.[1] || plainMatch?.[1] || '').trim();
      };
      const title = get('title');
      const link = get('link') || get('guid');
      const pubDate = get('pubDate');
      const desc = get('description').replace(/<[^>]+>/g, '').trim().slice(0, 180);
      // Try to get image
      const imgMatch = item.match(/url="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i) ||
                       item.match(/<media:thumbnail[^>]+url="([^"]+)"/i) ||
                       item.match(/<enclosure[^>]+url="([^"]+\.(jpg|jpeg|png|webp))"/i);
      const img = imgMatch?.[1] || '';
      const text = (title + ' ' + desc).toLowerCase();
      if (title && (text.includes('rayo') || text.includes('vallecas') || text.includes('vallecano'))) {
        items.push({ title, link, pubDate, desc, img });
      }
    }
    return items;
  };

  // RSS feeds that work server-side
  const feeds = [
    { url: 'https://unionrayo.com/feed/', source: 'Unión Rayo' },
    { url: 'https://feeds.as.com/mrss-s/pages/as/site/as.com/section/futbol/subsection/primera/', source: 'AS' },
    { url: 'https://www.mundodeportivo.com/rss/futbol.xml', source: 'Mundo Deportivo' },
    { url: 'https://www.elconfidencial.com/rss/deportes/futbol/', source: 'El Confidencial' },
  ];

  const results = await Promise.allSettled(
    feeds.map(({ url, source }) =>
      fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RayoBot/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        signal: AbortSignal.timeout(6000)
      })
      .then(r => r.ok ? r.text() : '')
      .then(xml => xml ? parseRSS(xml).map(i => ({ ...i, source })) : [])
      .catch(() => [])
    )
  );

  let items = [];
  results.forEach(r => { if (r.status === 'fulfilled') items.push(...r.value); });

  // Deduplicate and sort by date
  const seen = new Set();
  items = items
    .filter(i => { if (!i.title || seen.has(i.title.slice(0,40))) return false; seen.add(i.title.slice(0,40)); return true; })
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 12);

  res.json({ items, count: items.length, updated: new Date().toISOString() });
}
