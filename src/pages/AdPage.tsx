import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasPremiumAccess } from '../services/database';
import { AD_ZONE_PRICES } from '../types';
import AdForm from '../components/AdForm';
import AdGeneratorCanvas from '../components/AdGeneratorCanvas';
import { useTranslation } from '../i18n';

export default function AdPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [tab, setTab] = useState<'acheter' | 'generer'>('acheter');
  const [tiktokMsg, setTiktokMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tk = params.get('tiktok');
    if (tk === 'success') { setTiktokMsg(t('ad.tiktokConnected')); setTab('generer'); }
    else if (tk === 'error') setTiktokMsg(t('ad.tiktokError') + (params.get('reason') || ''));

    if (!user) { setHasAccess(false); return; }
    hasPremiumAccess(user.id, role).then(setHasAccess);
  }, [user, role]);

  const handleRequestAd = async () => {
    if (!user) return;
    const access = await hasPremiumAccess(user.id, role);
    if (!access) { setShowSubscribe(true); return; }
    setShowForm(true);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
            <Megaphone size={36} className="text-gold" />
          </div>
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-4">
            {t('ad.title')}
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            {t('ad.description')}
          </p>
        </div>

        {tiktokMsg && (
          <div className="mb-4 text-center text-xs font-bold bg-green-500/10 border border-green-500/30 rounded-lg py-2 px-4 text-green-400 max-w-md mx-auto">
            {tiktokMsg}
          </div>
        )}
        {hasAccess && (
          <div className="flex gap-1 mb-8 bg-luxury-dark border border-gold/10 rounded-xl p-1 max-w-xs mx-auto">
            <button
              onClick={() => setTab('acheter')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                tab === 'acheter' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Megaphone size={14} className="inline mr-1.5" /> {t('ad.tabBuy')}
            </button>
            <button
              onClick={() => setTab('generer')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                tab === 'generer' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Sparkles size={14} className="inline mr-1.5" /> {t('ad.tabGenerate')}
            </button>
          </div>
        )}

        {tab === 'generer' && hasAccess ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                <Sparkles size={20} className="text-gold" />
              </div>
              <div>
                <h2 className="font-playfair text-xl text-white font-bold">{t('ad.autoGenerator')}</h2>
                <p className="text-gray-500 text-xs">{t('ad.autoGeneratorDesc')}</p>
              </div>
            </div>
            <AdGeneratorCanvas />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto text-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
              {(Object.entries(AD_ZONE_PRICES) as [string, typeof AD_ZONE_PRICES[keyof typeof AD_ZONE_PRICES]][]).map(([key, zone]) => {
                const includesLive = key === 'hero' || key === 'popup' || key === 'between_products';
                return (
                  <div key={key} className={`bg-luxury-dark border rounded-xl p-6 flex items-start justify-between gap-4 ${includesLive ? 'border-gold/30' : 'border-gold/10'}`}>
                    <div>
                      <h3 className="text-gold font-bold text-sm mb-1">{zone.label}</h3>
                      <p className="text-gray-500 text-xs">{zone.desc}</p>
                      {includesLive && (
                        <span className="inline-block mt-2 text-[9px] bg-gold/10 text-gold px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">
                          {t('ad.liveIncluded')}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white text-2xl font-bold font-playfair">{zone.price}<span className="text-sm text-gray-500">{t('ad.perMonth')}</span></p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-gray-500 text-xs mb-8 italic">
              {t('ad.priceNote')}
            </p>

            <button
              onClick={handleRequestAd}
              className="px-10 py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all"
            >
              {t('ad.requestButton')}
            </button>
          </div>
        )}

        {showSubscribe && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4" onClick={() => setShowSubscribe(false)}>
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <div className="relative bg-luxury-dark border border-gold/20 rounded-xl p-8 max-w-md w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
              <Crown size={40} className="text-gold mx-auto mb-4" />
              <h3 className="text-white font-playfair text-xl font-bold mb-2">{t('ad.subRequired')}</h3>
              <p className="text-gray-400 text-sm mb-6">
                {t('ad.subRequiredDesc')}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowSubscribe(false)} className="flex-1 py-3 bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white/20 transition-all">
                  {t('ad.later')}
                </button>
                <button onClick={() => navigate('/abonnement')} className="flex-1 py-3 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-gold-light transition-all">
                  {t('ad.subscribe')}
                </button>
              </div>
            </div>
          </div>
        )}

        {showForm && <AdForm onClose={() => setShowForm(false)} />}
      </div>
    </div>
  );
}
