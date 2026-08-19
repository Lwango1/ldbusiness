import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { ShoppingBag, Clock, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Search, KeyRound, Copy, Check } from 'lucide-react';
import { Transaction } from '../types';
import { getTransactions } from '../services/database';
import { getMyVouchers, WifiVoucher } from '../services/ldconnect';
import { useAuth } from '../contexts/AuthContext';
import PaymentConfirmation from '../components/PaymentConfirmation';

export default function OrdersPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: t('orders.statusPending'), color: 'text-yellow-500', icon: Clock },
    pending_verification: { label: t('orders.statusVerification'), color: 'text-orange-400', icon: AlertTriangle },
    completed: { label: t('orders.statusCompleted'), color: 'text-green-500', icon: CheckCircle },
    cancelled: { label: t('orders.statusCancelled'), color: 'text-red-500', icon: XCircle },
  };
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [payingTxn, setPayingTxn] = useState<Transaction | null>(null);
  const [vouchers, setVouchers] = useState<Record<string, WifiVoucher>>({});
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (user) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refresh = () => {
    if (!user) return;
    getTransactions(user.id).then(setTransactions);
    getMyVouchers(user.id).then(vs => {
      const map: Record<string, WifiVoucher> = {};
      vs.forEach(v => { map[v.transactionId] = v; });
      setVouchers(map);
    }).catch(() => {});
  };

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen pt-28 px-6 bg-luxury-black flex flex-col items-center justify-center">
        <ShoppingBag size={48} className="text-gold/30 mb-4" />
        <p className="text-gray-400 font-playfair text-lg mb-4">{t('orders.loginRequired')}</p>
        <button onClick={() => navigate('/')} className="text-gold text-xs uppercase tracking-widest">{t('orders.backHome')}</button>
      </div>
    );
  }

  const filtered = transactions.filter(t =>
    t.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-2">{t('orders.title')}</h1>
          <p className="text-gray-500 text-sm">{transactions.length} {transactions.length > 1 ? t('orders.orders') : t('orders.order')}</p>
        </div>

        <div className="relative mb-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('orders.search')}
            className="w-full pl-12 pr-4 py-3 bg-luxury-dark border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gold/10 rounded-xl">
            <ShoppingBag size={48} className="mx-auto text-gold/20 mb-4" />
            <p className="text-gray-500 font-playfair italic text-lg">{t('orders.empty')}</p>
            <button onClick={() => navigate('/produits')} className="mt-4 text-gold text-xs uppercase tracking-widest font-bold">
              {t('orders.discover')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(txn => {
              const status = statusConfig[txn.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isExpanded = expanded === txn.id;

              return (
                <div key={txn.id} className="bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden hover:border-gold/20 transition-all">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${status.color.replace('text-', 'bg-')}`} />
                        <span className="text-white font-mono text-sm font-bold">{txn.invoiceNumber}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold ${status.color}`}>
                        <StatusIcon size={12} />
                        {status.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600 block">{t('orders.total')}</span>
                        <span className="text-gold font-bold">{txn.total.toLocaleString()} CDF</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">{t('orders.payment')}</span>
                        <span className="text-white uppercase">{txn.paymentMethod.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">{t('orders.date')}</span>
                        <span className="text-gray-400">{new Date(txn.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">{t('orders.delivery')}</span>
                        <span className="text-gray-400 truncate block">{txn.customerAddress || '—'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : txn.id)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-gold/20 text-gold text-[10px] uppercase tracking-widest rounded-sm hover:bg-gold/10 transition-all"
                      >
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {t('orders.details')}
                      </button>

                      {txn.status === 'pending' && (
                        <button
                          onClick={() => setPayingTxn(txn)}
                          className="px-4 py-1.5 bg-gold text-black font-bold text-[10px] uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all"
                        >
                          {t('orders.confirmPayment')}
                        </button>
                      )}

                      {txn.status === 'pending_verification' && txn.transactionId && (
                        <span className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] rounded-sm flex items-center gap-1">
                          {t('orders.id')} {txn.transactionId}
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gold/10 pt-4">
                      {vouchers[txn.invoiceNumber] && (
                        <div className="mb-4 p-4 bg-black/40 border border-gold/20 rounded-lg">
                          <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                            <KeyRound size={13} className="text-gold" /> {t('orders.voucherTitle')}
                          </h4>
                          {vouchers[txn.invoiceNumber].code ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500 text-xs">{t('orders.voucherCode')}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-gold font-mono font-bold text-sm tracking-widest">{vouchers[txn.invoiceNumber].code}</span>
                                  <button onClick={() => { navigator.clipboard?.writeText(vouchers[txn.invoiceNumber].code || ''); setCopied('code'); setTimeout(() => setCopied(''), 2000); }} className="text-gold/60 hover:text-gold">
                                    {copied === 'code' ? <Check size={13} /> : <Copy size={13} />}
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500 text-xs">{t('orders.voucherPassword')}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-mono font-bold text-sm tracking-widest">{vouchers[txn.invoiceNumber].password}</span>
                                  <button onClick={() => { navigator.clipboard?.writeText(vouchers[txn.invoiceNumber].password || ''); setCopied('pwd'); setTimeout(() => setCopied(''), 2000); }} className="text-gold/60 hover:text-gold">
                                    {copied === 'pwd' ? <Check size={13} /> : <Copy size={13} />}
                                  </button>
                                </div>
                              </div>
                              {vouchers[txn.invoiceNumber].expiresAt && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500 text-xs">{t('orders.voucherExpires')}</span>
                                  <span className="text-gray-300 text-xs">{new Date(vouchers[txn.invoiceNumber].expiresAt!).toLocaleDateString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-xs">{t('orders.voucherPending')}</p>
                          )}
                        </div>
                      )}

                      <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-3">{t('orders.articles')}</h4>
                      {txn.items.length > 0 ? (
                        <div className="space-y-2">
                          {txn.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs py-2 border-b border-gold/5 last:border-0">
                              <span className="text-gray-300">{item.productName}</span>
                              <span className="text-gray-500">x{item.quantity}</span>
                              <span className="text-white font-bold">{(item.price * item.quantity).toLocaleString()} CDF</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-xs italic">{t('orders.detailsUnavailable')}</p>
                      )}
                      <div className="mt-3 flex justify-between text-xs border-t border-gold/10 pt-3">
                        <span className="text-gray-500">{txn.customerName} • {txn.customerPhone}</span>
                        <span className="text-gold font-bold">{txn.total.toLocaleString()} CDF</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {payingTxn && (
          <PaymentConfirmation
            transactionId={payingTxn.id}
            invoiceNumber={payingTxn.invoiceNumber}
            total={payingTxn.total}
            onClose={() => { setPayingTxn(null); refresh(); }}
          />
        )}
      </div>
    </div>
  );
}
