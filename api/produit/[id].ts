const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pplelulfsradhjpnhtxg.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_T0dd6Gxk8zE4jlURIl8-qA_OxJQCGDL';

export default async function handler(req: any, res: any) {
  const { id } = req.query;

  if (!id) {
    return res.redirect(302, '/');
  }

  let name = '';
  let description = '';
  let image = '';

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${Number(id)}&select=name,description,images,image`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const products = await r.json();
    const product = products?.[0];
    if (product) {
      name = product.name || '';
      description = (product.description || '').slice(0, 200);
      image = product.images?.[0] || product.image || '';
    }
  } catch {}

  const title = name || 'LDBusiness';
  const desc = description || 'Marketplace de Luxe à Goma';
  const img = image || 'https://ldbusiness.vercel.app/icons/icon-512.png';
  const url = `https://ldbusiness.vercel.app/produit/${id}`;

  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const isCrawler = /bot|crawler|spider|facebook|whatsapp|twitter|telegram|slack|linkedin|pinterest|discord|embedly|quora/i.test(ua);

  if (!isCrawler) {
    return res.redirect(302, `/?p=${id}`);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} - LDBusiness</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:secure_url" content="${img}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${img}" />
</head>
<body>
  <p>${title} - LDBusiness</p>
</body>
</html>`);
}
