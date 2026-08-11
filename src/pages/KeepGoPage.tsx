import { useState, useEffect } from 'react';
import { Wifi, Globe, Smartphone, QrCode, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { keepGoPlans, KeepGoPlan, keepgoLink, planPriceCdf, WHATSAPP_NUMBER } from '../data/keepgo';
import { getKeepGoPlans } from '../services/keepgo';
import KeepGoOrderModal from '../components/KeepGoOrderModal';

interface KeepGoPageProps {
  onOpenAuth: () => void;
}

export default function KeepGoPage({ onOpenAuth }: KeepGoPageProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<KeepGoPlan | null>(null);
  const [plans, setPlans] = useState<KeepGoPlan[]>(keepGoPlans);

  useEffect(() => {
    getKeepGoPlans()
      .then(setPlans)
      .catch(() => {});
  }, []);

  const steps = [
    { icon: Globe, title: t('keepgo.step1Title'), desc: t('keepgo.step1Desc') },
    { icon: Smartphone, title: t('keepgo.step2Title'), desc: t('keepgo.step2Desc') },
    { icon: QrCode, title: t('keepgo.step3Title'), desc: t('keepgo.step3Desc') },
  ];

  return (
    <div className="min-h-screen bg-luxury-black pb-20">
      {/* HERO */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hero-bg.jpg" alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/95 via-luxury-black/80 to-luxury-black" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto pt-24 pb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase tracking-widest font-bold mb-6">
            <Wifi size={13} /> {t('keepgo.badge')}
          </div>
          <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            <span className="gold-shimmer">{t('keepgo.heroTitle')}</span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            {t('keepgo.heroDesc')}
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[t('keepgo.trust1'), t('keepgo.trust2'), t('keepgo.trust3')].map((x, i) => (
              <div key={i} className="text-center">
                <CheckCircle2 size={20} className="mx-auto text-gold mb-2" />
                <p className="text-gray-300 text-[10px] uppercase tracking-widest">{x}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="px-6 max-w-5xl mx-auto py-14">
        <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white text-center mb-3">{t('keepgo.howTitle')}</h2>
        <p className="text-gray-400 text-center mb-10 max-w-lg mx-auto">{t('keepgo.howDesc')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="bg-luxury-dark border border-gold/10 rounded-xl p-6 text-center hover:border-gold/30 transition-all">
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                <s.icon size={22} className="text-gold" />
              </div>
              <p className="text-[9px] text-gold uppercase tracking-widest font-bold mb-1">0{i + 1}</p>
              <h3 className="text-white font-bold mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FORFAITS */}
      <section className="px-6 max-w-6xl mx-auto pb-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase tracking-widest font-bold mb-4">
            <ShieldCheck size={13} /> {t('keepgo.plansBadge')}
          </div>
          <h2 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-4">{t('keepgo.plansTitle')}</h2>
          <p className="text-gray-400 max-w-xl mx-auto">{t('keepgo.plansDesc')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-luxury-dark rounded-xl overflow-hidden flex flex-col transition-all hover:border-gold/40 ${
                plan.popular ? 'border border-gold/60 shadow-xl shadow-gold/10' : 'border border-gold/10'
              }`}
            >
              {plan.popular && (
                <span className="absolute top-3 right-3 bg-gold text-black text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">
                  {t('keepgo.popular')}
                </span>
              )}
              <div className="p-6 pb-4">
                <p className="text-gold text-[10px] uppercase tracking-widest font-bold mb-1">{plan.zone}</p>
                <h3 className="text-white font-playfair text-2xl font-bold mb-4">{plan.name}</h3>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-black text-white leading-none">{plan.dataGb}</span>
                  <span className="text-gray-400 text-sm mb-1">Go</span>
                  <span className="ml-auto text-green-400 text-xs mb-1">{plan.validityDays} {t('keepgo.days')}</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-400 text-sm">
                      <CheckCircle2 size={14} className="text-gold shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto p-6 pt-0">
                <div className="mb-4">
                  <div className="text-gold font-black text-2xl">{planPriceCdf(plan).toLocaleString()} CDF</div>
                  <div className="text-gray-500 text-xs">≈ {plan.priceUsd} USD</div>
                </div>
                <button
                  onClick={() => setSelected(plan)}
                  className="w-full py-3.5 bg-gold text-black font-black uppercase tracking-widest text-[10px] rounded-sm shadow-lg shadow-gold/10 hover:bg-gold-light transition-all active:scale-[0.98]"
                >
                  {t('keepgo.order')} <ArrowRight size={14} className="inline ml-1" />
                </button>
                <a
                  href={keepgoLink(plan.keepgoUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center mt-3 text-[9px] text-gray-500 hover:text-gold uppercase tracking-widest transition-all"
                >
                  {t('keepgo.keepgoLink')}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 pt-10">
        <div className="max-w-3xl mx-auto text-center bg-luxury-dark border border-gold/20 rounded-2xl p-8 md:p-10">
          <QrCode size={36} className="text-gold mx-auto mb-4" />
          <h2 className="font-playfair text-2xl md:text-4xl font-bold text-white mb-3">{t('keepgo.ctaTitle')}</h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">{t('keepgo.ctaDesc')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-green-600 text-white font-bold uppercase tracking-widest text-[11px] rounded-sm hover:bg-green-500 transition-all"
            >
              {t('keepgo.whatsappCta')}
            </a>
            <a
              href={keepgoLink('https://www.keepgo.com/')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-gold/40 text-gold font-bold uppercase tracking-widest text-[11px] rounded-sm hover:bg-gold/10 transition-all"
            >
              {t('keepgo.keepgoSite')}
            </a>
          </div>
          <div className="mt-6 text-gray-600 text-[10px] flex items-center justify-center gap-2">
            <ShieldCheck size={12} className="text-gold" /> {t('keepgo.finalNote')}
          </div>
        </div>
      </section>

      {selected && (
        <KeepGoOrderModal plan={selected} onClose={() => setSelected(null)} onOpenAuth={onOpenAuth} />
      )}
    </div>
  );
}