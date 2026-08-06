const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY non configurée' });

  const { description = '', brand = '', tagline = '', whatsapp = '', language = 'fr', duration = 0, sequences = 0, secPerImg = 0 } = req.body || {};
  const desc = String(description).trim();
  if (!desc) return res.status(400).json({ error: 'description is required' });

  const targetSec = Math.max(Math.min(Math.round(Number(duration) || 0), 120), 0);
  const seqCount = Math.max(Math.min(Math.round(Number(sequences) || 0), 20), 1);
  const spi = Math.max(Math.round(Number(secPerImg) || 0), 1);
  const b = String(brand || 'LDBusiness').trim();
  const tgl = String(tagline || '').trim();
  const wa = String(whatsapp || '').trim().replace(/[^0-9+]/g, '');
  const waLine = wa ? ` Termine le message par une invitation à commander dès maintenant sur WhatsApp au ${wa}.` : '';

  const langPrompt: Record<string, string> = {
    fr: 'Rédige en français, ton publicitaire vendeur et professionnel.',
    en: 'Write in English, salesy and professional.',
    sw: 'Andika kwa Kiswahili, kwa lugha ya utangazaji na kitaalamu.',
  };

  const prompt = `Rédige un message publicitaire moderne pour ce produit, en utilisant ses mots-clés principaux.
Le message se dit en ${targetSec} secondes maximum. Il est découpé en ${seqCount} parties (une par image vidéo, environ ${spi} secondes chacune) enchaînées naturellement.
Enchaîne: une accroche forte, le bénéfice principal, ${seqCount >= 3 ? '2 à 3 arguments concrets (qualité, prix, disponibilité, livraison),' : ''} une touche d'urgence, et une incitation à commander${waLine}.
Langue: ${langPrompt[language] || langPrompt.fr}
Marque: ${b}
${tgl ? `Slogan: ${tgl}` : ''}
Produit: ${desc}
Réponds uniquement avec le texte du message.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 800 },
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
