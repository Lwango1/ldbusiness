const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY non configurée' });

  const { description = '', brand = '', tagline = '', whatsapp = '', language = 'fr' } = req.body || {};
  const desc = String(description).trim();
  if (!desc) return res.status(400).json({ error: 'description is required' });

  const b = String(brand || 'LDBusiness').trim();
  const tgl = String(tagline || '').trim();
  const wa = String(whatsapp || '').trim().replace(/[^0-9+]/g, '');
  const waLine = wa ? ` Termine le message par une invitation à commander dès maintenant sur WhatsApp au ${wa}.` : '';

  const langPrompt: Record<string, string> = {
    fr: 'Rédige en français, ton publicitaire vendeur et professionnel.',
    en: 'Write in English, salesy and professional.',
    sw: 'Andika kwa Kiswahili, kwa lugha ya utangazaji na kitaalamu.',
  };

  const prompt = `Tu es un expert en rédaction publicitaire. Analyse le produit décrit et rédige un script publicitaire vidéo court (3 à 4 phrases max, adapté à une voix off de 15 à 20 secondes).
${langPrompt[language] || langPrompt.fr}
Marque: ${b}
${tgl ? `Accroche/Slogan: ${tgl}` : ''}
Description du produit: ${desc}${waLine}
Contraintes: pas de guillemets, phrases courtes, rythme fluide, une accroche percutante au début, une incitation à commander à la fin. Ne mentionne pas le mot "script".`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 300 },
      }),
    });
    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(502).json({ error: 'Gemini ' + upstream.status + ': ' + errText.slice(0, 300) });
    }
    const data = await upstream.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: 'Réponse Gemini vide' });
    return res.json({ script: String(text).trim().replace(/^["']|["']$/g, '') });
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'gemini upstream failed' });
  }
}
