const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || '';
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'https://ldbusiness.vercel.app/api/tiktok/callback';

export default async function handler(req: any, res: any) {
  if (!TIKTOK_CLIENT_KEY) {
    return res.status(500).json({ error: 'TikTok non configuré. Ajoutez TIKTOK_CLIENT_KEY dans .env' });
  }

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId requis' });

  const scopes = ['user.info.basic', 'video.upload', 'video.publish'];
  const state = Buffer.from(JSON.stringify({ userId, nonce: Math.random().toString(36).slice(2) })).toString('base64url');
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&scope=${scopes.join(',')}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;

  res.redirect(302, authUrl);
}
