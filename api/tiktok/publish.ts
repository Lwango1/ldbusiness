const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, video_id, description, title } = req.body;
  if (!userId || !video_id) return res.status(400).json({ error: 'userId et video_id requis' });

  try {
    const tokenRes = await fetch(`${SUPABASE_URL}/rest/v1/tiktok_tokens?user_id=eq.${userId}&select=access_token,open_id`, {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
    });
    const tokens = await tokenRes.json();
    const token = tokens?.[0];
    if (!token) return res.status(401).json({ error: 'TikTok non connecté' });

    const publishRes = await fetch('https://open-api.tiktok.com/video/publish/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': token.access_token },
      body: JSON.stringify({
        source: 'FILE',
        video_id,
        post_info: {
          title: title || 'Nouvelle publication LDBusiness',
          description: description || '',
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
      }),
    });
    const publishData = await publishRes.json();
    if (publishData.error) return res.status(500).json({ error: publishData.error.message || 'Échec publication' });

    return res.json({ success: true, video_id, publish_id: publishData.data?.publish_id });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Erreur inconnue' });
  }
}
