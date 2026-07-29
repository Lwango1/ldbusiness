const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''; 
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || '';
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'https://ldbusiness.vercel.app/api/tiktok/callback';

export default async function handler(req: any, res: any) {
  const { code, state } = req.query;

  if (!code) {
    return res.redirect(302, '/publicite?tiktok=error&reason=no_code');
  }

  let userId = '';
  try {
    const stateData = JSON.parse(Buffer.from(state || 'e30=', 'base64url').toString());
    userId = stateData.userId || '';
  } catch { userId = req.query.userId || ''; }

  try {
    const tokenRes = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.data || !tokenData.data.access_token) {
      return res.redirect(302, '/publicite?tiktok=error&reason=token_failed');
    }

    const { access_token, refresh_token, expires_in, open_id } = tokenData.data;

    const userInfoRes = await fetch('https://open-api.tiktok.com/user/info/', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userInfo = await userInfoRes.json();
    const tiktokUsername = userInfo.data?.user?.display_name || 'TikTok';

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY && userId) {
      const existing = await fetch(`${SUPABASE_URL}/rest/v1/tiktok_tokens?user_id=eq.${userId}&select=id`, {
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
      });
      const existingData = await existing.json();

      if (existingData?.length > 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/tiktok_tokens?id=eq.${existingData[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
          body: JSON.stringify({ access_token, refresh_token, expires_at: Math.floor(Date.now() / 1000) + expires_in, open_id, username: tiktokUsername, updated_at: new Date().toISOString() }),
        });
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/tiktok_tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
          body: JSON.stringify({ user_id: userId, access_token, refresh_token, expires_at: Math.floor(Date.now() / 1000) + expires_in, open_id, username: tiktokUsername }),
        });
      }
    }

    res.redirect(302, '/publicite?tiktok=success');
  } catch {
    res.redirect(302, '/publicite?tiktok=error&reason=exception');
  }
}
