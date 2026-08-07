import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2, Gift, Package, UserPlus, ShieldCheck, Copy, Check, TrendingUp } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { getProducts } from '../services/database';
import { Product } from '../types';
import { getReferralCode, setReferralCode, getAgentByCode, getLead } from '../services/leads';
import type { Agent } from '../services/leads';

export default function OfferPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [refCode, setRefCodeLocal] = useState(getReferralCode());
  const [agent, setAgent] = useState<Agent | null>(null);
  const [refAgent, setRefAgent] = useState<Agent | null>(null);
  const [checkingRef, setCheckingRef] = useState(false);
  const [refError, setRefError] = useState('');
  const [leadForm, setLeadForm] = useState({ name: '', phone: '' });
  const [leadSaved, setLeadSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam);
      setRefCodeLocal(refParam.toUpperCase());
      setCheckingRef(true);
      getAgentByCode(refParam).then(a => {
        if (a) setRefAgent(a);
        setCheckingRef(false);
      });
    }
    getProducts().then(ps => setFeatured(ps.slice(0, 3)));
    const ref = getReferralCode();
    if (ref && !refParam) {
      setCheckingRef(true);
      getAgentByCode(ref).then(a => { if (a) setRefAgent(a); setCheckingRef(false); });
    }
    if (isAuthenticated && user) {
      getLead(user.id).then(a => { if (a) setAgent(a); });
    }
  }, [isAuthenticated, user, searchParams]);

  const handleApplyRef = () => {
    const code = refCode.trim().toUpperCase();
    if (!code) return;
    setCheckingRef(true);
    setRefError('');
    getAgentByCode(code).then(a => {
      setCheckingRef(false);
      if (a) { setReferralCode(code); setRefAgent(a); }
      else setRefError(t('offer.invalidRef'));
    });
  };

  const saveLead = () => {
    if (!leadForm.name || !leadForm.phone) return;
    setLeadSaved(true);
  };

  const goToNext = () => {
    if (step < 4) setStep((step + 1) as 2 | 3 | 4);
  };

  const copyLink = () => {
    if (!agent) return;
    const url = `${window.location.origin}/offre?ref=${agent.code}`;
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const stepsMeta = [
    { n: 1, icon: Sparkles, title: t('offer.step1Title') },
    { n: 2, icon: Package, title: t('offer.step2Title') },
    { n: 3, icon: UserPlus, title: t('offer.step3Title') },
    { n: 4, icon: ShieldCheck, title: t('offer.step4Title') },
  ];

  const inputCls = "w-full py-3.5 px-5 bg-luxury-dark/60 border border-gold/20 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none transition-all text-sm";

  return (
    <div className="min-h-screen bg-luxury-black pb-20">
      {/* ===== ÉTAPE 1 : Attraction ===== */}
      {step === 1 && (
        <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img src="/images/hero-bg.jpg" alt="" className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/95 via-luxury-black/80 to-luxury-black" />
          </div>
          <div className="relative z-10 text-center px-6 max-w-3xl mx-auto pt-24 pb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase tracking-widest font-bold mb-6">
              <Sparkles size={12} /> {t('offer.badge')}
            </div>
            <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              <span className="gold-shimmer">{t('offer.heroTitle')}</span>
            </h1>
            <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              {t('offer.heroDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <button onClick={goToNext} className="px-10 py-4 bg-gold text-black font-black rounded-sm uppercase tracking-widest text-[11px] shadow-2xl shadow-gold/20 hover:bg-gold-light transition-all flex items-center justify-center gap-2">
                {t('offer.seeOffer')} <ArrowRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[t('offer.trust1'), t('offer.trust2'), t('offer.trust3')].map((x, i) => (
                <div key={i} className="text-center">
                  <CheckCircle2 size={20} className="mx-auto text-gold mb-2" />
                  <p className="text-gray-300 text-[10px] uppercase tracking-widest">{x}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ÉTAPE 2 : Produits */}
      {step === 2 && (
        <section className="pt-28 px-6 max-w-6xl mx-auto pb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase tracking-widest font-bold mb-4">
              {t('offer.step2Badge')} {2}/4
            </div>
            <h2 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-4">{t('offer.featuredTitle')}</h2>
            <p className="text-gray-400 max-w-lg mx-auto">{t('offer.featuredDesc')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {featured.map(p => (
              <div key={p.id} className="bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden hover:border-gold/40 transition-all">
                <div className="aspect-square bg-black overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                </div>
                <div className="p-5">
                  <h3 className="text-white font-bold text-lg mb-1 truncate">{p.name}</h3>
                  <p className="text-gray-500 text-xs line-clamp-2 mb-3">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gold font-bold text-xl">{p.price.toLocaleString()} {p.currency}</span>
                    <button onClick={() => navigate(`/produit/${p.id}`)} className="text-gold border border-gold/30 px-3 py-1.5 rounded-sm text-[10px] uppercase tracking-widest hover:bg-gold hover:text-black transition-all">
                      {t('offer.view')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/produits')} className="px-8 py-4 border border-gold/40 text-gold font-bold rounded-sm uppercase tracking-widest text-[11px] hover:bg-gold/10 transition-all">
              {t('offer.allProducts')}
            </button>
            <button onClick={goToNext} className="px-8 py-4 bg-gold text-black font-black rounded-sm uppercase tracking-widest text-[11px] shadow-xl shadow-gold/10 hover:bg-gold-light transition-all flex items-center justify-center gap-2">
              {t('offer.continue')} <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* ÉTAPE 3 : Capture lead / code agent */}
      {step === 3 && (
        <section className="pt-28 max-w-6xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase tracking-widest font-bold mb-4">
                {t('offer.step3Badge')} {3}/4
              </div>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4">{t('offer.leadTitle')}</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">{t('offer.leadDesc')}</p>

              {!leadSaved ? (
                <div className="bg-luxury-dark border border-gold/10 rounded-xl p-6 space-y-4 max-w-md">
                  <div>
                    <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('offer.name')}</label>
                    <input type="text" value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} placeholder={t('offer.namePlaceholder')} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('offer.phone')}</label>
                    <input type="tel" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} placeholder="+243..." className={inputCls} />
                  </div>
                  <button onClick={saveLead} className="w-full py-4 bg-gold text-black font-black rounded-sm uppercase tracking-widest text-[11px] hover:bg-gold-light transition-all flex items-center justify-center gap-2">
                    <UserPlus size={16} /> {t('offer.sendLead')}
                  </button>
                  <p className="text-gray-600 text-[10px] text-center">{t('offer.leadPrivacy')}</p>
                </div>
              ) : (
                <div className="bg-green-600/10 border border-green-500/30 rounded-xl p-6 max-w-md">
                  <CheckCircle2 size={32} className="text-green-400 mb-3" />
                  <h3 className="text-green-400 font-bold text-lg mb-2">{t('offer.leadSaved')}</h3>
                  <p className="text-gray-400 text-sm mb-6">{t('offer.leadSavedDesc')}</p>
                  <button onClick={goToNext} className="px-6 py-3 bg-green-600/20 border border-green-500/40 text-green-400 font-bold rounded-sm uppercase tracking-widest text-[11px] hover:bg-green-600/30 transition-all">
                    {t('offer.continue')} →
                  </button>
                </div>
              )}
            </div>

            {/* Code agent de parrainage */}
            <div className="bg-luxury-dark border border-gold/10 rounded-xl p-6">
              <h3 className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4"><Gift size={14} /> {t('offer.agentTitle')}</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">{t('offer.agentDesc')}</p>

              <div className="flex gap-2 mb-2">
                <input type="text" value={refCode} onChange={e => setRefCodeLocal(e.target.value)} placeholder={t('offer.enterCode')} className={inputCls} />
                <button onClick={handleApplyRef} disabled={checkingRef} className="px-5 py-3 bg-gold text-black font-bold rounded-sm uppercase tracking-widest text-[10px] hover:bg-gold-light transition-all disabled:opacity-40 shrink-0">
                  {checkingRef ? '...' : t('offer.apply')}
                </button>
              </div>
              {refError && <p className="text-red-400 text-xs mb-2">{refError}</p>}
              {refAgent && (
                <div className="flex items-center gap-3 bg-gold/10 border border-gold/30 rounded-sm p-3 mb-4">
                  <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                  <div>
                    <p className="text-white text-xs font-bold">{t('offer.refAgent')} {refAgent.name}</p>
                    <p className="text-gold text-[10px]">{refAgent.code}</p>
                  </div>
                </div>
              )}

              {isAuthenticated && agent ? (
                <div className="mt-4 border-t border-gold/10 pt-4">
                  <p className="text-gray-300 text-xs mb-1">{t('offer.yourAgentCode')}</p>
                  <div className="flex items-center gap-2 justify-between bg-black border border-gold/10 rounded-sm p-3">
                    <span className="text-gold font-mono font-bold text-lg tracking-widest">{agent.code}</span>
                    <button onClick={copyLink} className="px-3 py-2 border border-gold/30 text-gold text-[10px] uppercase tracking-widest rounded-sm hover:bg-gold/10 transition-all flex items-center gap-1">
                      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? t('offer.copied') : t('offer.copyLink')}
                    </button>
                  </div>
                  <button onClick={() => navigate('/agent')} className="w-full mt-3 py-3 bg-gold/10 border border-gold/30 text-gold text-xs uppercase tracking-widest rounded-sm hover:bg-gold/20 transition-all flex items-center justify-center gap-2">
                    <TrendingUp size={14} /> {t('offer.goToAgentDash')}
                  </button>
                </div>
              ) : !isAuthenticated ? (
                <button onClick={() => navigate('/vendre')} className="w-full mt-5 py-3 bg-gold/10 border border-gold/30 text-gold text-xs uppercase tracking-widest rounded-sm hover:bg-gold/20 transition-all">
                  {t('offer.becomeAgent')}
                </button>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* ÉTAPE 4 : CTA vente */}
      {step === 4 && (
        <section className="pt-28 min-h-[80vh] flex items-center justify-center px-6">
          <div className="max-w-2xl mx-auto text-center bg-luxury-dark border border-gold/20 rounded-2xl p-10">
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={30} className="text-gold" />
            </div>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4">{t('offer.finalTitle')}</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">{t('offer.finalDesc')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => isAuthenticated ? navigate('/produits') : navigate('/offre')} className="px-8 py-4 bg-gold text-black font-black rounded-sm uppercase tracking-widest text-[11px] shadow-xl shadow-gold/20 hover:bg-gold-light transition-all">
                {t('offer.buyNow')}
              </button>
              <button onClick={() => navigate('/vendre')} className="px-8 py-4 border border-gold/40 text-gold font-bold rounded-sm uppercase tracking-widest text-[11px] hover:bg-gold/10 transition-all">
                {t('offer.startSelling')}
              </button>
            </div>
            <div className="mt-10 flex items-center justify-center gap-2 text-gray-500 text-[10px]">
              <Gift size={12} className="text-gold" /> {t('offer.giftNote')}
            </div>
          </div>
        </section>
      )}

      {/* Progression */}
      {step > 1 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-luxury-black/95 backdrop-blur border-t border-gold/10 px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
            {stepsMeta.map(s => (
              <div key={s.n} className={`flex items-center gap-2 shrink-0 ${step === s.n ? 'text-gold' : step > s.n ? 'text-gold/70' : 'text-gray-600'}`}>
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${step === s.n ? 'border-gold bg-gold/10' : step > s.n ? 'border-green-500/50 text-green-400' : 'border-gray-700'}`}>
                  {step > s.n ? <CheckCircle2 size={15} /> : <s.icon size={15} />}
                </div>
                <span className="text-[10px] uppercase tracking-widest hidden md:inline">{s.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}