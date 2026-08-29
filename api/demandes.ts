// =============================================
// Collecteur de demandes — API Vercel
// Récupère des requêtes/mots-clés réellement
// recherchés par les gens via Google Actualités RSS
// Portée MONDIALE : recherche dans le monde entier
// (gratuit, sans clé API, respectueux des ToS)
// =============================================

export const config = { runtime: 'nodejs' };

type Region = {
  label: string;
  gl: string; // code pays Google News ('world' = globale)
  ceid: string;
};

// Régions disponibles — 'world' = monde entier
const REGIONS: Record<string, Region> = {
  world: { label: 'Monde entier', gl: 'us', ceid: 'US:en' },
  us: { label: 'États-Unis', gl: 'us', ceid: 'US:en' },
  fr: { label: 'France & Europe FR', gl: 'fr', ceid: 'FR:fr' },
  afrique: { label: 'Afrique FR', gl: 'cd', ceid: 'CD:fr' },
  uk: { label: 'Royaume-Uni', gl: 'gb', ceid: 'GB:en' },
  ca: { label: 'Canada', gl: 'ca', ceid: 'CA:en' },
  au: { label: 'Australie', gl: 'au', ceid: 'AU:en' },
  es: { label: 'Espagne', gl: 'es', ceid: 'ES:es' },
  br: { label: 'Brésil', gl: 'br', ceid: 'BR:pt' },
  na: { label: 'Nigéria', gl: 'ng', ceid: 'NG:en' },
  za: { label: 'Afrique du Sud', gl: 'za', ceid: 'ZA:en' },
};

type Category = {
  id: string;
  label: string;
  queries: string[]; // langues variées pour couvrir le monde
};

// Catégories alignées sur les produits LDBusiness
// Mots-clés en plusieurs langues pour une portée mondiale
const CATEGORIES: Record<string, Category> = {
  mode: {
    id: 'mode',
    label: 'Mode & Habillement',
    queries: [
      'buy african dress online',
      'men suit price shop',
      'wedding dress shop',
      'african fashion trend',
      'robe africaine prix acheter',
      'costume homme boutique',
      'Tenue africaine moderne',
      'African clothing outlet',
    ],
  },
  deco: {
    id: 'deco',
    label: 'Décoration & Événements',
    queries: [
      'wedding decoration price',
      'event decor shop',
      'party decoration ideas',
      'décoration mariage prix',
      'birthday decoration service',
      'balloon decoration cost',
      'event planner decoration',
      'salle fête location prix',
    ],
  },
  internet: {
    id: 'internet',
    label: 'Internet / WiFi',
    queries: [
      'cheap internet package',
      'wifi hotspot price',
      'affordable internet plans',
      'wifi router buy',
      'internet pas cher',
      'connexion internet forfait',
      'best wifi deal',
      'high speed internet offers',
    ],
  },
  general: {
    id: 'general',
    label: 'Business & Achats',
    queries: [
      'buy products online',
      'online store shopping',
      'ecommerce best deals',
      'shop now discount',
      'achat en ligne promo',
      'boutique en ligne',
      'order online fast delivery',
      'best online shopping sites',
    ],
  },
  voyage: {
    id: 'voyage',
    label: 'Voyage & Hôtels',
    queries: [
      'book hotel online',
      'cheap hotel deals',
      'travel booking sites',
      'hotel near me book',
      'réservation hôtel pas cher',
      'voyage hôtel prix',
      'best hotel discounts',
      'flight and hotel package',
      'hôtel chambre disponible',
      'vacation rental book',
    ],
  },
  vehicules: {
    id: 'vehicules',
    label: 'Véhicules & Moto',
    queries: [
      'buy used car online',
      'new car price deal',
      'motorcycle for sale',
      'buy scooter online',
      'voiture occasion prix acheter',
      'moto pas chère vendre',
      'car dealership offers',
      'cheap cars for sale',
      'moto neuve prix',
      'second hand motorcycle buy',
    ],
  },
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRss(xml: string) {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const title = stripHtml((block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
    const link = (block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
    const desc = (block.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';
    const source = (block.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || '';
    if (title) {
      items.push({
        title,
        link: link.replace(/&amp;/g, '&'),
        pubDate,
        description: stripHtml(desc),
        source: stripHtml(source),
      });
    }
  }
  return items;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=900');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const catId = String(req.query.cat || 'general');
  const regionId = String(req.query.region || 'world');
  const cat = CATEGORIES[catId] || CATEGORIES.general;
  const region = REGIONS[regionId] || REGIONS.world;

  const results: any[] = [];
  const seen = new Set<string>();

  // Interroge Google Actualités RSS pour chaque mot-clé de la catégorie,
  // dans la région/région du monde sélectionnée
  for (const q of cat.queries) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=fr&gl=${region.gl}&ceid=${region.ceid}`;
    try {
      const upstream = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LDBusinessLeadCollector/1.0)' },
      });
      if (!upstream.ok) continue;
      const xml = await upstream.text();
      const items = parseRss(xml);
      for (const it of items) {
        const key = it.title.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({ ...it, category: catId, keyword: q });
      }
    } catch {
      // ignore les erreurs réseau par requête
    }
  }

  // Tri par date récente
  results.sort((a, b) => (a.pubDate < b.pubDate ? 1 : -1));

  return res.status(200).json({
    category: cat.label,
    region: region.label,
    count: results.length,
    generatedAt: new Date().toISOString(),
    demandes: results.slice(0, 30),
  });
}
