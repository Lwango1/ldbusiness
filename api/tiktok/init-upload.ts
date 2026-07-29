const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, fileSize, description, title } = req.body;
  if (!userId || !fileSize) return res.status(400).json({ error: 'userId et fileSize requis' });

  try {
    const tokenRes = await fetch(`${SUPABASE_URL}/rest/v1/tiktok_tokens?user_id=eq.${userId}&select=access_token,open_id`, {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
    });
    const tokens = await tokenRes.json();
    const token = tokens?.[0];
    if (!token) return res.status(401).json({ error: 'TikTok non connecté' });

    const initRes = await fetch('https://open-api.tiktok.com/video/upload/init/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': token.access_token },
      body: JSON.stringify({ source: 'FILE', size: fileSize }),
    });
    const initData = await initRes.json();
    if (!initData.data?.upload_url) return res.status(500).json({ error: 'Échec init upload', detail: initData });

    return res.json({
      upload_url: initData.data.upload_url,
      video_id: initData.data.video_id,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Erreur inconnue' });
  }
}
