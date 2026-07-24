import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Ad } from '../types';
import { getAds, incrementAdImpression } from '../services/database';

const ROTATION_INTERVALS: Record<string, number | null> = {
  between_products: null, // carousel continu (pas d'intervalle, défilement libre)
  hero: 30 * 60 * 1000,
  popup: 2.4 * 60 * 60 * 1000,
  sidebar: 8 * 60 * 60 * 1000,
};

interface AdBannerProps {
  zone: 'hero' | 'between_products' | 'popup' | 'sidebar';
}

function isVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

function AdMedia({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (isVideo(src)) {
    return <video src={src} autoPlay muted loop playsInline className={className || 'w-full aspect-[21/9] object-cover'} />;
  }
  return <img src={src} alt={alt} className={className || 'w-full aspect-[21/9] object-cover'} />;
}

export default function AdBanner({ zone }: AdBannerProps) {
  const navigate = useNavigate();
  const [ads, setAds] = useState<Ad[]>([]);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const isCarousel = zone === 'between_products';

  useEffect(() => {
    getAds(zone).then(setAds);
  }, [zone]);

  useEffect(() => {
    if (!ads.length) return;
    incrementAdImpression(ads[index].id);
  }, [index, ads]);

  const next = useCallback(() => {
    setIndex(prev => (prev + 1) % ads.length);
  }, [ads.length]);

  const prev = useCallback(() => {
    setIndex(prev => (prev - 1 + ads.length) % ads.length);
  }, [ads.length]);

  // Rotation timer pour hero / popup / sidebar
  useEffect(() => {
    if (isCarousel || ads.length <= 1) return;
    const interval = ROTATION_INTERVALS[zone];
    if (!interval) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [zone, ads.length, isCarousel, next]);

  // Auto-slide carousel toutes les 6 secondes
  useEffect(() => {
    if (!isCarousel || ads.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [isCarousel, ads.length, next]);

  if (!ads.length || dismissed) return null;

  const ad = ads[index];

  const handleAdClick = () => {
    incrementAdImpression(ad.id);
    if (ad.userId) {
      navigate(`/boutique/${ad.userId}`);
    } else if (ad.brandWebsite) {
      window.open(ad.brandWebsite, '_blank', 'noopener');
    }
  };

  const handlePopupVisit = () => {
    incrementAdImpression(ad.id);
    if (ad.userId) {
      navigate(`/boutique/${ad.userId}`);
    } else if (ad.brandWebsite) {
      window.open(ad.brandWebsite, '_blank', 'noopener');
    }
  };

  // Popup
  if (zone === 'popup') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDismissed(true)} />
        <div className="relative max-w-sm w-full bg-luxury-dark border border-gold/20 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          {ad.brandLogo && (
            <div className="absolute top-3 left-3 z-10">
              <img src={ad.brandLogo} alt={ad.brandName} className="h-8 w-8 rounded-full border border-gold/30" />
            </div>
          )}
          <AdMedia src={ad.imageUrl} alt={ad.brandName} className="w-full aspect-[4/3] object-cover" />
          <div className="p-4">
            <h3 className="text-white font-bold text-sm">{ad.brandName}</h3>
            {ad.description && <p className="text-gray-400 text-xs mt-1">{ad.description}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={handlePopupVisit} className="flex-1 py-2.5 bg-gold text-black font-bold text-[10px] uppercase tracking-widest rounded-sm text-center hover:bg-gold-light transition-all flex items-center justify-center gap-1">
                Voir la boutique
              </button>
              <button onClick={() => setDismissed(true)} className="px-4 py-2.5 border border-gray-500/30 text-gray-400 text-[10px] rounded-sm hover:border-gray-500/50 transition-all">
                <X size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar
  if (zone === 'sidebar') {
    return (
      <div className="relative bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden group">
        <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 z-10 p-1 bg-black/40 rounded-full text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <X size={12} />
        </button>
        <button onClick={handleAdClick} className="w-full text-left">
          <AdMedia src={ad.imageUrl} alt={ad.brandName} className="w-full aspect-[2/3] object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="text-white text-[10px] font-bold uppercase tracking-widest">{ad.brandName}</p>
          </div>
        </button>
      </div>
    );
  }

  // Carrousel (between_products) — défilement continu avec contrôles
  if (isCarousel) {
    return (
      <div className="relative bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden group mb-10">
        <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 z-10 p-1.5 bg-black/40 rounded-full text-gray-400 hover:text-white transition-opacity">
          <X size={14} />
        </button>
        <button onClick={handleAdClick} className="w-full text-left">
          <AdMedia src={ad.imageUrl} alt={ad.brandName} className="w-full aspect-[21/9] md:aspect-[3/1] object-cover transition-opacity duration-500" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6">
            <div className="flex items-center gap-3">
              {ad.brandLogo && <img src={ad.brandLogo} alt="" className="h-8 w-8 rounded-full border border-gold/30" />}
              <div>
                <p className="text-white font-bold text-sm md:text-base">{ad.brandName}</p>
                {ad.description && <p className="text-gray-300 text-xs">{ad.description}</p>}
              </div>
            </div>
          </div>
        </button>
        {ads.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100">
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
              {ads.map((_, i) => (
                <button key={i} onClick={() => setIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-gold w-4' : 'bg-white/40 hover:bg-white/60'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Hero (défaut)
  return (
    <div className="relative bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden group mb-10">
      <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 z-10 p-1.5 bg-black/40 rounded-full text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
      <button onClick={handleAdClick} className="w-full text-left block">
        <AdMedia src={ad.imageUrl} alt={ad.brandName} className="w-full aspect-[21/9] md:aspect-[3/1] object-cover" />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6">
          <div className="flex items-center gap-3">
            {ad.brandLogo && <img src={ad.brandLogo} alt="" className="h-8 w-8 rounded-full border border-gold/30" />}
            <div>
              <p className="text-white font-bold text-sm md:text-base">{ad.brandName}</p>
              {ad.description && <p className="text-gray-300 text-xs">{ad.description}</p>}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
