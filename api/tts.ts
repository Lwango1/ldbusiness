const GOOGLE_TTS = 'https://translate.google.com/translate_tts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { text = '', lang = 'fr' } = req.query;
  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    const url = `${GOOGLE_TTS}?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(String(text).slice(0, 180))}&tl=${lang}`;
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://translate.google.com/',
      },
    });
    if (!upstream.ok) throw new Error('upstream ' + upstream.status);
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', (upstream.headers.get('Content-Type') || 'audio/mpeg').split(';')[0]);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('Content-Length', buf.length);
    return res.end(buf);
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'tts upstream failed' });
  }
}