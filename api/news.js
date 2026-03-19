export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600'); // cache 1 hora

  // RSS feeds de medios deportivos españoles sobre Rayo Vallecano
  const feeds = [
    'https://feeds.as.com/mrss-s/pages/as/site/as.com/section/futbol/subsection/primera/',
    'https://e00-marca.uecdn.es/rss/futbol/primera-division.xml',
    'https://www.mundodeportivo.com/rss/futbol.xml',
    'https://unionrayo.com/feed/',
  ];

  const parseRSS = (xml) => {
    const items = [];
    const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi);
    for (const match of itemMatches) {
      const item = match[1];
      const title = item.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i)?.[1] ||
                    item.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] || '';
      const link = item.match(/<link[^>]*>(.*?)<\/link>/i)?.[1] ||
                   item.match(/<guid[^>]*>(.*?)<\/guid>/i)?.[1] || '';
      const pubDate = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i)?.[1] || '';
      const description = item.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>/i)?.[1] ||
                          item.match(/<description[^>]*>(.*?)<\/description>/i)?.[1] || '';
      const imgMatch = item.match(/<media:content[^>]+url="([^"]+)"/i) ||
                       item.match(/<enclosure[^>]+url="([^"]+)"/i) ||
                       description.match(/<img[^>]+src="([^"]+)"/i);
      const img = imgMatch?.[1] || '';

      // Solo noticias del Rayo Vallecano
      const text = (title + description).toLowerCase();
      if (text.includes('rayo') && (text.includes('vallecano') || text.includes('vallecas'))) {
        items.push({
          title: title.replace(/<[^>]+>/g, '').trim(),
          link: link.trim(),
          pubDate,
          description: description.replace(/<[^>]+>/g, '').trim().slice(0, 150),
          img
        });
      }
    }
    return items;
  };

  try {
    const results = await Promise.allSettled(
      feeds.map(url => fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 RayoApp/1.0' },
        signal: AbortSignal.timeout(5000)
      }).then(r => r.text()))
    );

    let allItems = [];
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        try { allItems.push(...parseRSS(r.value)); } catch(e) {}
      }
    });

    // Ordenar por fecha más reciente y quitar duplicados
    const seen = new Set();
    allItems = allItems
      .filter(item => {
        if (!item.title || seen.has(item.title)) return false;
        seen.add(item.title);
        return true;
      })
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 12);

    res.status(200).json({ items: allItems });
  } catch(e) {
    res.status(500).json({ error: e.message, items: [] });
  }
}
