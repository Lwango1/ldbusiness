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

  const prompt = `Tu es un expert en rédaction publicitaire professionnelle. Analyse le produit décrit et rédige un script publicitaire vidéo COMPLET et structuré, en 5 à 8 phrases fluides adaptées à une voix off de 25 à 40 secondes.
Structure obligatoire du script:
1. Une accroche percutante qui capte l'attention dès la première phrase.
2. Présentation du produit et de sa valeur (bénéfice principal pour le client).
3. 2 à 3 arguments de vente concrets (qualité, prix, disponibilité, livraison, garantie...).
4. Un élément d'urgence ou d'exclusivité (offre limitée, stock limité).
5. Une incitation claire à commander.
${langPrompt[language] || langPrompt.fr}
Marque: ${b}
${tgl ? `Accroche/Slogan: ${tgl}` : ''}
Description du produit: ${desc}${waLine}
Contraintes: pas de guillemets ni de puces, phrases complètes et bien rédigées, ton vendeur et convaincant mais crédible, chaque phrase commence par une majuscule et se termine par un point. Ne mentionne pas le mot "script" ni "voix off". Réponds uniquement avec le texte du script.`;

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
