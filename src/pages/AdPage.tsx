import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Crown, X, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getActiveSubscription } from '../services/database';
import { AD_ZONE_PRICES } from '../types';
import AdForm from '../components/AdForm';

export default function AdPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);

  const handleRequestAd = async () => {
    if (!user) return;
    const sub = await getActiveSubscription(user.id);
    if (!sub) { setShowSubscribe(true); return; }
    setShowForm(true);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black">
      <div className="max-w-3xl mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
          <Megaphone size={36} className="text-gold" />
        </div>
        <h1 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-4">
          Publicité LDBusiness
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto mb-10">
          Mettez votre marque en avant sur la première marketplace de luxe à Goma.
          Choisissez votre espace publicitaire et touchez des milliers de clients.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
          {(Object.entries(AD_ZONE_PRICES) as [string, typeof AD_ZONE_PRICES[keyof typeof AD_ZONE_PRICES]][]).map(([key, zone]) => {
            const includesLive = key === 'hero' || key === 'between_products';
            return (
              <div key={key} className={`bg-luxury-dark border rounded-xl p-6 flex items-start justify-between gap-4 ${includesLive ? 'border-gold/30' : 'border-gold/10'}`}>
                <div>
                  <h3 className="text-gold font-bold text-sm mb-1">{zone.label}</h3>
                  <p className="text-gray-500 text-xs">{zone.desc}</p>
                  {includesLive && (
                    <span className="inline-block mt-2 text-[9px] bg-gold/10 text-gold px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">
                      + Live inclus
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white text-2xl font-bold font-playfair">{zone.price}<span className="text-sm text-gray-500">$/mois</span></p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-gray-500 text-xs mb-8 italic">
          * Prix par zone, par mois. Vous devez être membre abonné (3$/mois) pour accéder à la publicité.
        </p>

        <button
          onClick={handleRequestAd}
          className="px-10 py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all"
        >
          Faire une demande
        </button>

        {showSubscribe && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4" onClick={() => setShowSubscribe(false)}>
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <div className="relative bg-luxury-dark border border-gold/20 rounded-xl p-8 max-w-md w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
              <Crown size={40} className="text-gold mx-auto mb-4" />
              <h3 className="text-white font-playfair text-xl font-bold mb-2">Abonnement requis</h3>
              <p className="text-gray-400 text-sm mb-6">
                Vous devez être membre abonné (3$/mois) ou prendre une pub à partir de 10$/mois pour faire de la publicité.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowSubscribe(false)} className="flex-1 py-3 bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white/20 transition-all">
                  Plus tard
                </button>
                <button onClick={() => navigate('/abonnement')} className="flex-1 py-3 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-gold-light transition-all">
                  S'abonner
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
