const LIVEKIT_URL = 'wss://ldbusiness-wuihfpq1.livekit.cloud';

export async function getLiveKitToken(roomName: string, identity: string, canPublish: boolean = false): Promise<string> {
  const res = await fetch('/api/livekit-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName, identity, canPublish }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get token');
  return data.token;
}

export { LIVEKIT_URL };
