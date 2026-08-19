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
      const r = await fetch(`${SUPABASE_URL}/rest/v1/transactions?transaction_id=eq.${encodeURIComponent(transactionId)}&select=id,status,payment_method,invoice_number`, {
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
      });
      const rows = await r.json();
      if (rows && rows.length > 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/transactions?id=eq.${rows[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
          body: JSON.stringify({ status: 'completed', payment_method: 'maxicash' }),
        });

        // LDConnect : génère automatiquement le voucher WiFi (facture LDC-...)
        const invoiceNumber = rows[0].invoice_number || '';
        if (invoiceNumber.startsWith('LDC-')) {
          const vRes = await fetch(`${SUPABASE_URL}/rest/v1/wifi_vouchers?transaction_id=eq.${encodeURIComponent(invoiceNumber)}&select=id,status,duration_hours`, {
            headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
          });
          const vRows = await vRes.json();
          const v = vRows && vRows.length > 0 ? vRows[0] : null;
          if (v && v.status === 'pending') {
            const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            const rand = (n: number) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
            const code = `LDCT-${rand(4)}-${rand(4)}`;
            const password = rand(6);
            await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_generate_voucher`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
              body: JSON.stringify({ p_voucher_id: v.id, p_code: code, p_password: password, p_duration_hours: v.duration_hours || 1 }),
            });
          }
        }
      }
    } catch (err) {
      console.error('[maxicash-webhook] update error:', err);
    }
  }

  return res.status(200).json({ status: 'success' });
}