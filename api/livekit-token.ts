import jwt from 'jsonwebtoken';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { roomName, identity, canPublish, name } = req.body;

  if (!roomName || !identity) {
    return res.status(400).json({ error: 'Missing roomName or identity' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const now = Math.floor(Date.now() / 1000);

  const payload: Record<string, any> = {
    iss: apiKey,
    iat: now,
    exp: now + 3600,
    sub: identity,
    name: name || identity,
    video: {
      room: roomName,
      roomJoin: true,
      canPublish: !!canPublish,
      canSubscribe: true,
    },
  };

  const token = jwt.sign(payload, apiSecret, { algorithm: 'HS256' });

  res.status(200).json({ token });
}
