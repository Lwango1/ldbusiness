const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { userId } = req.query;
  if (!userId || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.json({ connected: false });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tiktok_tokens?user_id=eq.${userId}&select=access_token,username,open_id,expires_at`, {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
    });
    const data = await r.json();
    const token = data?.[0];
    if (!token) return res.json({ connected: false });

    const expired = token.expires_at && token.expires_at < Math.floor(Date.now() / 1000);
    return res.json({ connected: !expired, username: token.username || 'TikTok', openId: token.open_id });
  } catch {
    return res.json({ connected: false });
  }
}
