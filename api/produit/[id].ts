import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://pplelulfsradhjpnhtxg.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_T0dd6Gxk8zE4jlURIl8-qA_OxJQCGDL'
);

export default async function handler(req: any, res: any) {
  const { id } = req.query;

  if (!id) {
    return res.redirect(302, '/');
  }

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', Number(id))
    .maybeSingle();

  const title = product?.name || 'LDBusiness';
  const description = product?.description?.slice(0, 200) || 'Marketplace de Luxe à Goma';
  const image = product?.images?.[0] || product?.image || 'https://ldbusiness.vercel.app/icons/icon-512.png';
  const url = `https://ldbusiness.vercel.app/produit/${id}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} - LDBusiness</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0;url=${url}" />
  <script>window.location.replace("${url}");</script>
</head>
<body>
  <p>Redirection vers <a href="${url}">${title}</a>...</p>
</body>
</html>`);
}
