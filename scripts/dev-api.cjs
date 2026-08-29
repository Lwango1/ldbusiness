const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const GOOGLE_TTS = 'https://translate.google.com/translate_tts';

loadEnv();

function loadEnv() {
  const envFile = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_.]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    if (key in process.env) continue;
    process.env[key] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}
function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
    });
  });
}

function tts(req, res, url) {
  const text = String(url.searchParams.get('text') || '').slice(0, 180);
  const lang = String(url.searchParams.get('lang') || 'fr');
  if (!text) return json(res, 400, { error: 'text is required' });

  const target = `${GOOGLE_TTS}?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text)}&tl=${lang}`;
  const upstream = https.get(target, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://translate.google.com/' },
  }, (up) => {
    if (up.statusCode !== 200 && up.statusCode !== 302) return res.end('upstream ' + up.statusCode);
    if (up.statusCode === 302) {
      const follow = https.get(up.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://translate.google.com/' } }, (f) => {
        res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
        f.pipe(res);
      });
      follow.on('error', () => { res.writeHead(502); res.end(); });
      up.resume();
      return;
    }
    res.writeHead(200, { 'Content-Type': (up.headers['content-type'] || 'audio/mpeg').split(';')[0] });
    up.pipe(res);
  });
  upstream.on('error', () => { res.writeHead(502); res.end(); });
}

function tiktokAuth(req, res, url) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY || '';
  if (!clientKey) return json(res, 500, { error: 'TikTok non configuré. Ajoutez TIKTOK_CLIENT_KEY dans .env' });
  const userId = url.searchParams.get('userId');
  if (!userId) return json(res, 400, { error: 'userId requis' });
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || 'http://localhost:5173/api/tiktok/callback';
  const scopes = ['user.info.basic', 'video.upload', 'video.publish'];
  const state = Buffer.from(JSON.stringify({ userId, nonce: Math.random().toString(36).slice(2) })).toString('base64url');
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scopes.join(',')}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  redirect(res, authUrl);
}

async function tiktokStatus(req, res, url) {
  const su = process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  const userId = url.searchParams.get('userId');
  if (!userId || !su || !key) return json(res, 200, { connected: false });
  try {
    const r = await fetch(`${su}/rest/v1/tiktok_tokens?user_id=eq.${userId}&select=access_token,username,open_id,expires_at`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const data = await r.json();
    const t = data?.[0];
    if (!t) return json(res, 200, { connected: false });
    const expired = t.expires_at && t.expires_at < Math.floor(Date.now() / 1000);
    return json(res, 200, { connected: !expired, username: t.username || 'TikTok', openId: t.open_id });
  } catch {
    return json(res, 200, { connected: false });
  }
}

async function tiktokCallback(req, res, url) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '';
  if (!code) return redirect(res, '/publicite?tiktok=error&reason=no_code');
  let userId = '';
  try {
    userId = (JSON.parse(Buffer.from(state || 'e30=', 'base64url').toString()) || {}).userId || '';
  } catch { userId = url.searchParams.get('userId') || ''; }

  try {
    const base = {
      client_key: process.env.TIKTOK_CLIENT_KEY || '',
      client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI || 'https://ldbusiness.vercel.app/api/tiktok/callback',
    };
    const tokenRes = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(base),
    });
    const td = await tokenRes.json();
    if (!td.data || !td.data.access_token) return redirect(res, '/publicite?tiktok=error&reason=token_failed');
    const { access_token, refresh_token, expires_in, open_id } = td.data;
    const uiRes = await fetch('https://open-api.tiktok.com/user/info/', { headers: { Authorization: `Bearer ${access_token}` } });
    const ui = await uiRes.json();
    const uname = ui.data?.user?.display_name || 'TikTok';

    const su = process.env.VITE_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_KEY || '';
    if (su && key && userId) {
      const exRes = await fetch(`${su}/rest/v1/tiktok_tokens?user_id=eq.${userId}&select=id`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      const ex = await exRes.json();
      const exp = Math.floor(Date.now() / 1000) + expires_in;
      const row = JSON.stringify({ access_token, refresh_token, expires_at: exp, open_id, username: uname });
      if (ex?.length > 0) {
        await fetch(`${su}/rest/v1/tiktok_tokens?id=eq.${ex[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
          body: JSON.stringify({ access_token, refresh_token, expires_at: exp, open_id, username: uname, updated_at: new Date().toISOString() }),
        });
      } else {
        await fetch(`${su}/rest/v1/tiktok_tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
          body: JSON.stringify({ user_id: userId, ...JSON.parse(row) }),
        });
      }
    }
    return redirect(res, '/publicite?tiktok=success');
  } catch {
    return redirect(res, '/publicite?tiktok=error&reason=exception');
  }
}

async function tiktokInitUpload(req, res) {
  const body = await readBody(req);
  const { userId, fileSize } = body;
  if (!userId || !fileSize) return json(res, 400, { error: 'userId et fileSize requis' });
  const su = process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  try {
    const tr = await fetch(`${su}/rest/v1/tiktok_tokens?user_id=eq.${userId}&select=access_token,open_id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const token = (await tr.json())?.[0];
    if (!token) return json(res, 401, { error: 'TikTok non connecté' });
    const initRes = await fetch('https://open-api.tiktok.com/video/upload/init/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': token.access_token },
      body: JSON.stringify({ source: 'FILE', size: fileSize }),
    });
    const d = await initRes.json();
    if (!d.data?.upload_url) return json(res, 500, { error: 'Échec init upload', detail: d });
    return json(res, 200, { upload_url: d.data.upload_url, video_id: d.data.video_id });
  } catch (e) {
    return json(res, 500, { error: e.message || 'Erreur inconnue' });
  }
}

async function tiktokPublish(req, res) {
  const body = await readBody(req);
  const { userId, video_id, description, title } = body;
  if (!userId || !video_id) return json(res, 400, { error: 'userId et video_id requis' });
  const su = process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  try {
    const tr = await fetch(`${su}/rest/v1/tiktok_tokens?user_id=eq.${userId}&select=access_token,open_id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const token = (await tr.json())?.[0];
    if (!token) return json(res, 401, { error: 'TikTok non connecté' });
    const pr = await fetch('https://open-api.tiktok.com/video/publish/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': token.access_token },
      body: JSON.stringify({
        source: 'FILE', video_id,
        post_info: {
          title: title || 'Nouvelle publication LDBusiness',
          description: description || '',
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false, disable_comment: false, disable_stitch: false,
        },
      }),
    });
    const d = await pr.json();
    if (d.error) return json(res, 500, { error: d.error.message || 'Échec publication' });
    return json(res, 200, { success: true, video_id, publish_id: d.data?.publish_id });
  } catch (e) {
    return json(res, 500, { error: e.message || 'Erreur inconnue' });
  }
}

async function aiScript(req, res) {
  const key = process.env.GEMINI_API_KEY || '';
  if (!key) return json(res, 500, { error: 'GEMINI_API_KEY non configurée' });

  const body = await readBody(req);
  const desc = String(body.description || '').trim();
  if (!desc) return json(res, 400, { error: 'description is required' });

  const targetSec = Math.max(Math.min(Math.round(Number(body.duration) || 0), 120), 0);
  const seqCount = Math.max(Math.min(Math.round(Number(body.sequences) || 0), 20), 1);
  const spi = Math.max(Math.round(Number(body.secPerImg) || 0), 1);
  const b = String(body.brand || 'LDBusiness').trim();
  const tgl = String(body.tagline || '').trim();
  const wa = String(body.whatsapp || '').trim().replace(/[^0-9+]/g, '');
  const language = String(body.language || 'fr');
  const waLine = wa ? ` Termine le message par une invitation à commander dès maintenant sur WhatsApp au ${wa}.` : '';

  const langPrompt = {
    fr: 'Rédige en français, ton publicitaire vendeur et professionnel.',
    en: 'Write in English, salesy and professional.',
    sw: 'Andika kwa Kiswahili, kwa lugha ya utangazaji na kitaalamu.',
  };

  const prompt = `Rédige un message publicitaire moderne pour ce produit, en utilisant ses mots-clés principaux.
Le message se dit en ${targetSec} secondes maximum. Il est découpé en ${seqCount} parties (une par image vidéo, environ ${spi} secondes chacune) enchaînées naturellement.
Enchaîne: une accroche forte, le bénéfice principal, ${seqCount >= 3 ? '2 à 3 arguments concrets (qualité, prix, disponibilité, livraison),' : ''} une touche d'urgence, et une incitation à commander${waLine}.
Langue: ${langPrompt[language] || langPrompt.fr}
Marque: ${b}
${tgl ? `Slogan: ${tgl}` : ''}
Produit: ${desc}
Réponds uniquement avec le texte du message.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 800 },
      }),
    });
    if (!upstream.ok) {
      const errText = await upstream.text();
      return json(res, 502, { error: 'Gemini ' + upstream.status + ': ' + errText.slice(0, 300) });
    }
    const data = await upstream.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return json(res, 502, { error: 'Réponse Gemini vide' });
    return json(res, 200, { script: String(text).trim().replace(/^["']|["']$/g, '') });
  } catch (err) {
    return json(res, 502, { error: err?.message || 'gemini upstream failed' });
  }
}

async function wifiCreateUser(req, res) {
  const body = await readBody(req);
  const { code, password, profile, durationHours } = body;
  if (!code || !password || !durationHours) return json(res, 400, { error: 'code, password et durationHours requis' });

  const baseUrl = String(process.env.MIKROTIK_REST_URL || '').replace(/\/+$/, '');
  const token = process.env.MIKROTIK_API_TOKEN || '';
  const user = process.env.MIKROTIK_USER || '';
  const pass = process.env.MIKROTIK_PASSWORD || '';

  if (!baseUrl || (!token && (!user || !pass))) {
    return json(res, 200, { pushed: false, reason: 'not_configured' });
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  else headers.Authorization = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');

  const h = Number(durationHours);
  const uptime = h >= 720 ? `${Math.round(h / 720)}M` : h >= 168 ? `${Math.round(h / 168)}w` : h >= 24 ? `${Math.round(h / 24)}d` : `${h}h`;

  try {
    const r = await fetch(`${baseUrl}/rest/ip/hotspot/user`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: code, password, profile: profile || 'default', 'limit-uptime': uptime }),
    });
    if (!r.ok) {
      const text = await r.text();
      return json(res, r.status, { pushed: false, error: text.slice(0, 300) });
    }
    return json(res, 200, { pushed: true });
  } catch (e) {
    return json(res, 502, { pushed: false, error: e.message || 'mikrotik unreachable' });
  }
}

const DEMANDE_REGIONS = {
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

const DEMANDE_CATEGORIES = {
  mode: {
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

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRss(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
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

async function demandes(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const catId = String(url.searchParams.get('cat') || 'general');
  const regionId = String(url.searchParams.get('region') || 'world');
  const cat = DEMANDE_CATEGORIES[catId] || DEMANDE_CATEGORIES.general;
  const region = DEMANDE_REGIONS[regionId] || DEMANDE_REGIONS.world;

  const results = [];
  const seen = new Set();
  for (const q of cat.queries) {
    const rss = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=fr&gl=${region.gl}&ceid=${region.ceid}`;
    try {
      const upstream = await fetch(rss, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LDBusinessLeadCollector/1.0)' },
      });
      if (!upstream.ok) continue;
      const xml = await upstream.text();
      for (const it of parseRss(xml)) {
        const key = it.title.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({ ...it, category: catId, keyword: q });
      }
    } catch (e) { /* ignore */ }
  }
  results.sort((a, b) => (a.pubDate < b.pubDate ? 1 : -1));

  return json(res, 200, {
    category: cat.label,
    region: region.label,
    count: results.length,
    generatedAt: new Date().toISOString(),
    demandes: results.slice(0, 30),
  });
}

async function maxicashWebhook(req, res) {
  const body = await readBody(req);
  const status = body.status;
  const transactionId = String(body.transaction_id || '');

  if (status !== 'SUCCESS') {
    return json(res, 400, { status: 'failed' });
  }

  if (!transactionId) return json(res, 400, { status: 'failed', error: 'transaction_id requis' });

  const su = process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  if (su && key) {
    try {
      const r = await fetch(`${su}/rest/v1/transactions?transaction_id=eq.${encodeURIComponent(transactionId)}&select=id,status,payment_method,invoice_number`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      const rows = await r.json();
      if (rows && rows.length > 0) {
        await fetch(`${su}/rest/v1/transactions?id=eq.${rows[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
          body: JSON.stringify({ status: 'completed', payment_method: 'maxicash' }),
        });

        // LDConnect : génère automatiquement le voucher WiFi (facture LDC-...)
        const invoiceNumber = rows[0].invoice_number || '';
        if (invoiceNumber.startsWith('LDC-')) {
          const vRes = await fetch(`${su}/rest/v1/wifi_vouchers?transaction_id=eq.${encodeURIComponent(invoiceNumber)}&select=id,status,duration_hours`, {
            headers: { apikey: key, Authorization: `Bearer ${key}` },
          });
          const vRows = await vRes.json();
          const v = vRows && vRows.length > 0 ? vRows[0] : null;
          if (v && v.status === 'pending') {
            const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            const rand = (n) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
            const code = `LDCT-${rand(4)}-${rand(4)}`;
            const password = rand(6);
            await fetch(`${su}/rest/v1/rpc/admin_generate_voucher`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
              body: JSON.stringify({ p_voucher_id: v.id, p_code: code, p_password: password, p_duration_hours: v.duration_hours || 1 }),
            });
          }
        }
      }
    } catch (e) {
      console.error('[maxicash-webhook] update error:', e.message);
    }
  }

  return json(res, 200, { status: 'success' });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); return res.end(); }

  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  const routes = {
    '/api/ai-script': () => aiScript(req, res),
    '/api/demandes': () => demandes(req, res),
    '/api/tts': () => tts(req, res, url),
    '/api/tiktok/auth': () => tiktokAuth(req, res, url),
    '/api/tiktok/status': () => tiktokStatus(req, res, url),
    '/api/tiktok/callback': () => tiktokCallback(req, res, url),
    '/api/tiktok/init-upload': () => tiktokInitUpload(req, res),
    '/api/tiktok/publish': () => tiktokPublish(req, res),
    '/tiktok/init-upload': () => tiktokInitUpload(req, res),
    '/tiktok/publish': () => tiktokPublish(req, res),
    '/api/webhooks/maxicash': () => maxicashWebhook(req, res),
    '/api/wifi/create-user': () => wifiCreateUser(req, res),
  };
  const handler = routes[p];
  if (!handler) { res.writeHead(404); return res.end('Not found'); }
  return handler();
});

const port = parseInt(process.env.API_PORT || '3000', 10);
server.listen(port, () => console.log(`[dev-api] serving /api and /tiktok on http://localhost:${port}`));