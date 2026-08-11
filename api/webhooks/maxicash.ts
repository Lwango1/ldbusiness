const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'failed', error: 'Method not allowed' });

  let body: any = {};
  try {
    body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}');
  } catch {
    return res.status(400).json({ status: 'failed', error: 'Invalid JSON' });
  }

  const status = body.status;
  const transactionId = String(body.transaction_id || '');

  if (status !== 'SUCCESS') {
    return res.status(400).json({ status: 'failed' });
  }

  if (!transactionId) return res.status(400).json({ status: 'failed', error: 'transaction_id requis' });

  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/transactions?transaction_id=eq.${encodeURIComponent(transactionId)}&select=id,status,payment_method`, {
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
      });
      const rows = await r.json();
      if (rows && rows.length > 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/transactions?id=eq.${rows[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
          body: JSON.stringify({ status: 'completed', payment_method: 'maxicash' }),
        });
      }
    } catch (err) {
      console.error('[maxicash-webhook] update error:', err);
    }
  }

  return res.status(200).json({ status: 'success' });
}