import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { roomName, identity, canPublish } = req.body;

  if (!roomName || !identity) {
    return res.status(400).json({ error: 'Missing roomName or identity' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    ttl: '1h',
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: !!canPublish,
    canSubscribe: true,
  });

  res.status(200).json({ token: token.toJwt() });
}
