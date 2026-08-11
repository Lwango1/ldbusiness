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
      const r = await fetch(`${su}/rest/v1/transactions?transaction_id=eq.${encodeURIComponent(transactionId)}&select=id,status,payment_method`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      const rows = await r.json();
      if (rows && rows.length > 0) {
        await fetch(`${su}/rest/v1/transactions?id=eq.${rows[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
          body: JSON.stringify({ status: 'pending_verification', payment_method: 'maxicash' }),
        });
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
    '/api/tts': () => tts(req, res, url),
    '/api/tiktok/auth': () => tiktokAuth(req, res, url),
    '/api/tiktok/status': () => tiktokStatus(req, res, url),
    '/api/tiktok/callback': () => tiktokCallback(req, res, url),
    '/api/tiktok/init-upload': () => tiktokInitUpload(req, res),
    '/api/tiktok/publish': () => tiktokPublish(req, res),
    '/tiktok/init-upload': () => tiktokInitUpload(req, res),
    '/tiktok/publish': () => tiktokPublish(req, res),
    '/api/webhooks/maxicash': () => maxicashWebhook(req, res),
  };
  const handler = routes[p];
  if (!handler) { res.writeHead(404); return res.end('Not found'); }
  return handler();
});

const port = parseInt(process.env.API_PORT || '3000', 10);
server.listen(port, () => console.log(`[dev-api] serving /api and /tiktok on http://localhost:${port}`));