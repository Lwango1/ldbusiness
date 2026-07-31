import { useState, useEffect } from 'react';
import { Crown, Check, Loader, CreditCard, X, Radio, Megaphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_PRICES, SubscriptionPlan, AD_ZONE_PRICES } from '../types';
import { getActiveSubscription, createSubscription, getMySubscriptions } from '../services/database';
import { useTranslation } from '../i18n';

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSub, setActiveSub] = useState<any>(null);
  const [mySubs, setMySubs] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<{type: 'sub' | 'ad'; key: string; price: number; label: string; live: boolean} | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [txId, setTxId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [active, all] = await Promise.all([
        getActiveSubscription(user.id),
        getMySubscriptions(user.id),
      ]);
      setActiveSub(active);
      setMySubs(all);
      setLoading(false);
    })();
  }, [user]);

  const handleSelectPlan = (type: 'sub' | 'ad', key: string, price: number, label: string, live: boolean) => {
    setSelectedPlan({ type, key, price, label, live });
    setShowPayment(true);
    setError('');
    setTxId('');
  };

  const handleSubmitPayment = async () => {
    if (!user || !selectedPlan) return;
    if (!txId.trim()) { setError(t('sub.transactionIdRequired')); return; }
    setSubscribing(true);
    setError('');

    const planKey: SubscriptionPlan = selectedPlan.type === 'ad' ? 'monthly' : selectedPlan.key as SubscriptionPlan;
    const sub = await createSubscription(user.id, planKey, selectedPlan.price);
    if (!sub) { setError(t('sub.createError')); setSubscribing(false); return; }

    setSuccess(true);
    setSubscribing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-28 px-6 bg-luxury-black flex flex-col items-center justify-center">
        <Crown size={48} className="text-gold/30 mb-4" />
        <p className="text-gray-400 font-playfair text-lg">{t('sub.loginRequired')}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-gold text-xs uppercase tracking-widest">{t('sub.backHome')}</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-28 px-6 bg-luxury-black flex items-center justify-center">
        <Loader size={32} className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-luxury-black via-luxury-dark to-luxury-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="text-gold" size={20} />
            <span className="text-gold text-xs uppercase tracking-[0.3em] font-bold">{t('sub.pageTitle')}</span>
          </div>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mt-2 mb-4">
            <span className="gold-shimmer">{t('sub.becomeMember')}</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">
            {t('sub.description')}
          </p>
          <div className="mt-4 inline-block bg-gold/10 border border-gold/20 rounded-full px-5 py-2">
            <span className="text-gold text-xs font-bold">{t('sub.freeMonth')}</span>
          </div>
        </div>

        {activeSub && (
          <div className="max-w-md mx-auto text-center mb-12">
            <div className="bg-luxury-dark border border-gold/20 rounded-xl p-8">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                <Crown size={32} className="text-gold" />
              </div>
              <p className="text-gold font-playfair text-xl font-bold mb-2">{t('sub.activeMember')}</p>
              {activeSub.amountUsd === 0 ? (
                <p className="text-green-400 text-sm font-bold mb-1">{t('sub.freeMonthGranted')}</p>
              ) : null}
              <p className="text-gray-400 text-sm">
                {t('sub.expiresOn')} {activeSub.endDate ? new Date(activeSub.endDate).toLocaleDateString('fr-FR') : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Abonnement Live */}
        <div className="mb-6">
          <div className="flex items-center gap-2 justify-center mb-8">
            <Radio size={16} className="text-gold" />
            <span className="text-gold text-xs uppercase tracking-[0.3em] font-bold">{t('sub.liveStreaming')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            {(Object.entries(SUBSCRIPTION_PRICES) as [SubscriptionPlan, typeof SUBSCRIPTION_PRICES[SubscriptionPlan]][]).map(([key, info]) => (
              <div key={key} className="bg-luxury-dark border border-gold/10 rounded-xl p-6 text-center transition-all hover:border-gold/40">
                <p className="text-gold text-xs uppercase tracking-widest font-bold mb-2">{info.label}</p>
                <p className="text-white text-4xl font-bold font-playfair mb-4">
                  {info.price}<span className="text-sm text-gray-500 font-normal">$</span>
                </p>
                <ul className="text-left space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-gray-300"><Check size={14} className="text-gold shrink-0" /> {t('sub.liveStreaming')}</li>
                  <li className="flex items-center gap-2 text-gray-300"><Check size={14} className="text-gold shrink-0" /> {t('sub.prioritySupport')}</li>
                </ul>
                <button onClick={() => handleSelectPlan('sub', key, info.price, info.label, true)} className="w-full py-3 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all">
                  {t('sub.choose')}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Publicité */}
        <div className="mb-10">
          <div className="flex items-center gap-2 justify-center mb-8">
            <Megaphone size={16} className="text-gold" />
            <span className="text-gold text-xs uppercase tracking-[0.3em] font-bold">{t('sub.zoneAd')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {(Object.entries(AD_ZONE_PRICES) as [string, {label: string; price: number; description?: string}][]).map(([key, zone]) => {
              const liveIncluded = key === 'hero' || key === 'popup' || key === 'between_products';
              return (
                <div key={key} className="bg-luxury-dark border border-gold/10 rounded-xl p-6 text-center transition-all hover:border-gold/40">
                  <p className="text-gold text-xs uppercase tracking-widest font-bold mb-2">{zone.label}</p>
                  <p className="text-white text-4xl font-bold font-playfair mb-4">
                    {zone.price}<span className="text-sm text-gray-500 font-normal">$/mois</span>
                  </p>
                  <p className="text-gray-600 text-[10px] mb-4">{zone.desc}</p>
                  <ul className="text-left space-y-2 mb-6 text-sm">
                    <li className="flex items-center gap-2 text-gray-300"><Check size={14} className="text-gold shrink-0" /> {t('sub.banner')} {zone.label}</li>
                    {liveIncluded ? (
                      <li className="flex items-center gap-2 text-green-400"><Check size={14} className="text-green-400 shrink-0" /> {t('sub.liveIncluded')}</li>
                    ) : (
                      <li className="flex items-center gap-2 text-gray-600"><X size={14} className="text-gray-600 shrink-0" /> {t('sub.withoutLive')}</li>
                    )}
                  </ul>
                  <button onClick={() => handleSelectPlan('ad', key, zone.price, zone.label, liveIncluded)} className="w-full py-3 bg-gold/80 text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold transition-all">
                    {t('sub.choose')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Paiement Airtel Money */}
        {showPayment && selectedPlan && !success && (
          <div className="max-w-md mx-auto bg-luxury-dark border border-gold/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest">{t('sub.paymentTitle')}</h3>
              <button onClick={() => { setShowPayment(false); setError(''); }} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>

            <div className="bg-black/40 rounded-lg p-4 mb-4 text-center">
              <p className="text-gray-400 text-xs mb-1">{t('sub.amountToPay')}</p>
              <p className="text-gold text-3xl font-bold font-playfair">{selectedPlan.price}<span className="text-sm text-gray-500">$</span></p>
              <p className="text-gray-500 text-xs mt-1">{selectedPlan.label}</p>
            </div>

            <div className="space-y-3 mb-4">
              <p className="text-gray-400 text-xs">{t('sub.transferInstruction')}</p>
              <div className="bg-black/40 rounded-lg p-3 flex items-center justify-between">
                <div>
                   <p className="text-white text-sm font-bold">+243 996 710 821</p>
                      <p className="text-gray-600 text-[10px]">{t('sub.recipient')}</p>
                </div>
                <CreditCard size={20} className="text-gold" />
              </div>
              <p className="text-gray-500 text-[10px]">{t('sub.transactionIdInstruction')}</p>
            </div>

            <input
              type="text"
              value={txId}
              onChange={e => setTxId(e.target.value)}
              placeholder={t('sub.transactionIdLabel')}
              className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm mb-4"
            />

            {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}

            <button onClick={handleSubmitPayment} disabled={subscribing} className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center justify-center gap-2">
              {subscribing ? <><Loader size={16} className="animate-spin" /> {t('sub.processing')}</> : <>{t('sub.submit')}</>}
            </button>
          </div>
        )}

        {success && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-luxury-dark border border-gold/20 rounded-xl p-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-500" />
              </div>
              <p className="text-white font-playfair text-xl font-bold mb-2">{t('sub.successTitle')}</p>
              <p className="text-gray-400 text-sm mb-2">{t('sub.successMessage')}</p>
              {selectedPlan?.type === 'ad' && (
                <p className="text-gray-500 text-xs mb-6">{t('sub.successNext')}</p>
              )}
              <button onClick={() => { setSuccess(false); setShowPayment(false); setSelectedPlan(null); }} className="text-gold text-xs uppercase tracking-widest hover:underline">
                {t('sub.ok')}
              </button>
            </div>
          </div>
        )}

        {/* Historique */}
        {mySubs.length > 0 && (
          <div className="max-w-2xl mx-auto mt-12">
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-4">{t('sub.history')}</h3>
            <div className="space-y-2">
              {mySubs.map(sub => (
                <div key={sub.id} className="bg-luxury-dark border border-gold/10 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {SUBSCRIPTION_PRICES[sub.plan]?.label || sub.plan} — {sub.amountUsd}$
                    </p>
                    <p className="text-gray-600 text-[10px]">{new Date(sub.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                    sub.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/30' :
                    sub.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' :
                    'bg-red-500/10 text-red-500 border border-red-500/30'
                  }`}>
                    {sub.status === 'active' ? t('sub.active') : sub.status === 'pending' ? t('sub.pending') : t('sub.expired')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
