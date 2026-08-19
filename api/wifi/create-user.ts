// Crée un utilisateur hotspot / voucher sur le routeur MikroTik (API REST v7+).
// Si MIKROTIK_REST_URL n'est pas configuré, renvoie pushed:false (import manuel).

function uptimeFor(hours: number): string {
  if (hours >= 720) return `${Math.round(hours / 720)}M`;
  if (hours >= 168) return `${Math.round(hours / 168)}w`;
  if (hours >= 24) return `${Math.round(hours / 24)}d`;
  return `${hours}h`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, password, profile, durationHours } = req.body || {};
  if (!code || !password || !durationHours) {
    return res.status(400).json({ error: 'code, password et durationHours requis' });
  }

  const baseUrl = (process.env.MIKROTIK_REST_URL || '').replace(/\/+$/, '');
  const token = process.env.MIKROTIK_API_TOKEN || '';
  const user = process.env.MIKROTIK_USER || '';
  const pass = process.env.MIKROTIK_PASSWORD || '';

  if (!baseUrl || (!token && (!user || !pass))) {
    return res.status(200).json({ pushed: false, reason: 'not_configured' });
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers.Authorization = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
  }

  try {
    const r = await fetch(`${baseUrl}/rest/ip/hotspot/user`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: code,
        password,
        profile: profile || 'default',
        'limit-uptime': uptimeFor(Number(durationHours)),
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ pushed: false, error: text.slice(0, 300) });
    }

    return res.status(200).json({ pushed: true });
  } catch (err: any) {
    return res.status(502).json({ pushed: false, error: err?.message || 'mikrotik unreachable' });
  }
}