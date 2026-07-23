import { useState, useEffect } from 'react';
import { Crown, Check, Loader, CreditCard, ChevronLeft, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_PRICES, SubscriptionPlan } from '../types';
import { getActiveSubscription, createSubscription, getMySubscriptions } from '../services/database';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSub, setActiveSub] = useState<any>(null);
  const [mySubs, setMySubs] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
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

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPayment(true);
    setError('');
    setTxId('');
  };

  const handleSubmitPayment = async () => {
    if (!user || !selectedPlan) return;
    if (!txId.trim()) { setError('Veuillez entrer l\'ID de transaction Airtel Money'); return; }
    setSubscribing(true);
    setError('');
    const info = SUBSCRIPTION_PRICES[selectedPlan];
    const sub = await createSubscription(user.id, selectedPlan, info.price);
    if (!sub) { setError('Erreur lors de la création de l\'abonnement. Réessayez.'); setSubscribing(false); return; }
    setSuccess(true);
    setSubscribing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-28 px-6 bg-luxury-black flex flex-col items-center justify-center">
        <Crown size={48} className="text-gold/30 mb-4" />
        <p className="text-gray-400 font-playfair text-lg">Connectez-vous pour vous abonner</p>
        <button onClick={() => navigate('/')} className="mt-4 text-gold text-xs uppercase tracking-widest">Retour à l'accueil</button>
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
            <span className="text-gold text-xs uppercase tracking-[0.3em] font-bold">Abonnement</span>
          </div>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mt-2 mb-4">
            <span className="gold-shimmer">Devenir Membre</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">
            Accédez au live streaming et à la publicité. Frais de maintenance de la plateforme.
          </p>
        </div>

        {activeSub ? (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-luxury-dark border border-gold/20 rounded-xl p-8">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                <Crown size={32} className="text-gold" />
              </div>
              <p className="text-gold font-playfair text-xl font-bold mb-2">Membre Actif</p>
              <p className="text-gray-400 text-sm">
                Expire le {activeSub.endDate ? new Date(activeSub.endDate).toLocaleDateString('fr-FR') : 'N/A'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
              {(Object.entries(SUBSCRIPTION_PRICES) as [SubscriptionPlan, typeof SUBSCRIPTION_PRICES[SubscriptionPlan]][]).map(([key, info]) => (
                <div key={key} className={`bg-luxury-dark border rounded-xl p-6 text-center transition-all hover:border-gold/40 ${selectedPlan === key ? 'border-gold' : 'border-gold/10'}`}>
                  <p className="text-gold text-xs uppercase tracking-widest font-bold mb-2">{info.label}</p>
                  <p className="text-white text-4xl font-bold font-playfair mb-4">
                    {info.price}<span className="text-sm text-gray-500 font-normal">$</span>
                  </p>
                  <ul className="text-left space-y-2 mb-6 text-sm">
                    <li className="flex items-center gap-2 text-gray-300"><Check size={14} className="text-gold shrink-0" /> Live streaming</li>
                    <li className="flex items-center gap-2 text-gray-300"><Check size={14} className="text-gold shrink-0" /> Publicité</li>
                    <li className="flex items-center gap-2 text-gray-300"><Check size={14} className="text-gold shrink-0" /> Support prioritaire</li>
                  </ul>
                  <button onClick={() => handleSelectPlan(key)} className="w-full py-3 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all">
                    Choisir
                  </button>
                </div>
              ))}
            </div>

            {/* Paiement Airtel Money */}
            {showPayment && selectedPlan && !success && (
              <div className="max-w-md mx-auto bg-luxury-dark border border-gold/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest">Paiement Airtel Money</h3>
                  <button onClick={() => { setShowPayment(false); setError(''); }} className="text-gray-500 hover:text-white"><X size={18} /></button>
                </div>

                <div className="bg-black/40 rounded-lg p-4 mb-4 text-center">
                  <p className="text-gray-400 text-xs mb-1">Montant à payer</p>
                  <p className="text-gold text-3xl font-bold font-playfair">{SUBSCRIPTION_PRICES[selectedPlan].price}<span className="text-sm text-gray-500">$</span></p>
                  <p className="text-gray-500 text-xs mt-1">Plan {SUBSCRIPTION_PRICES[selectedPlan].label}</p>
                </div>

                <div className="space-y-3 mb-4">
                  <p className="text-gray-400 text-xs">Effectuez le transfert Airtel Money au numéro suivant :</p>
                  <div className="bg-black/40 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-bold">+243 000 000 000</p>
                      <p className="text-gray-600 text-[10px]">Nom du destinataire</p>
                    </div>
                    <CreditCard size={20} className="text-gold" />
                  </div>
                  <p className="text-gray-500 text-[10px]">Entrez l'ID de la transaction reçu par SMS après le paiement.</p>
                </div>

                <input
                  type="text"
                  value={txId}
                  onChange={e => setTxId(e.target.value)}
                  placeholder="ID de transaction Airtel Money"
                  className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm mb-4"
                />

                {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}

                <button onClick={handleSubmitPayment} disabled={subscribing} className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                  {subscribing ? <><Loader size={16} className="animate-spin" /> Traitement...</> : <>Confirmer le paiement</>}
                </button>
              </div>
            )}

            {success && (
              <div className="max-w-md mx-auto text-center">
                <div className="bg-luxury-dark border border-gold/20 rounded-xl p-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-500" />
                  </div>
                  <p className="text-white font-playfair text-xl font-bold mb-2">Demande envoyée !</p>
                  <p className="text-gray-400 text-sm">Votre demande d'abonnement est en attente de vérification. Un administrateur validera votre paiement sous 24h.</p>
                  <button onClick={() => { setSuccess(false); setShowPayment(false); setSelectedPlan(null); }} className="mt-6 text-gold text-xs uppercase tracking-widest">OK</button>
                </div>
              </div>
            )}

            {/* Historique */}
            {mySubs.length > 0 && (
              <div className="max-w-2xl mx-auto mt-12">
                <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-4">Mes abonnements</h3>
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
                        {sub.status === 'active' ? 'Actif' : sub.status === 'pending' ? 'En attente' : 'Expiré'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
