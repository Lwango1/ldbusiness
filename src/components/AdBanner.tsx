import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Ad } from '../types';
import { getAds, incrementAdImpression } from '../services/database';

interface AdBannerProps {
  zone: 'hero' | 'between_products' | 'popup' | 'sidebar';
}

export function useAds(zone: 'hero' | 'between_products' | 'popup' | 'sidebar') {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    getAds(zone).then(setAds);
  }, [zone]);

  const currentAd = ads.length > 0 ? ads[currentIndex % ads.length] : null;

  const rotate = () => {
    if (ads.length > 0) {
      setCurrentIndex(prev => (prev + 1) % ads.length);
    }
  };

  return { currentAd, ads, rotate, currentIndex };
}

function isVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

function AdMedia({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (isVideo(src)) {
    return (
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className={className || 'w-full aspect-[21/9] object-cover'}
      />
    );
  }
  return <img src={src} alt={alt} className={className || 'w-full aspect-[21/9] object-cover'} />;
}

export default function AdBanner({ zone }: AdBannerProps) {
  const { currentAd, rotate } = useAds(zone);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!currentAd) return;
    incrementAdImpression(currentAd.id);
  }, [currentAd?.id]);

  useEffect(() => {
    if (!currentAd) return;
    if (zone === 'popup') {
      setVisible(true);
    }
  }, [currentAd?.id, zone]);

  if (!currentAd || dismissed) return null;

  if (zone === 'popup') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDismissed(true)} />
        <div className="relative max-w-sm w-full bg-luxury-dark border border-gold/20 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          {currentAd.brandLogo && (
            <div className="absolute top-3 left-3 z-10">
              <img src={currentAd.brandLogo} alt={currentAd.brandName} className="h-8 w-8 rounded-full border border-gold/30" />
            </div>
          )}
          <AdMedia src={currentAd.imageUrl} alt={currentAd.brandName} className="w-full aspect-[4/3] object-cover" />
          <div className="p-4">
            <h3 className="text-white font-bold text-sm">{currentAd.brandName}</h3>
            {currentAd.description && <p className="text-gray-400 text-xs mt-1">{currentAd.description}</p>}
            <div className="flex gap-2 mt-3">
              {currentAd.brandWebsite && (
                <a href={currentAd.brandWebsite} target="_blank" rel="noopener noreferrer" onClick={() => incrementAdImpression(currentAd.id)} className="flex-1 py-2.5 bg-gold text-black font-bold text-[10px] uppercase tracking-widest rounded-sm text-center hover:bg-gold-light transition-all flex items-center justify-center gap-1">
                  <ExternalLink size={12} /> Voir
                </a>
              )}
              <button onClick={() => setDismissed(true)} className="px-4 py-2.5 border border-gray-500/30 text-gray-400 text-[10px] rounded-sm hover:border-gray-500/50 transition-all">
                <X size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (zone === 'sidebar') {
    return (
      <div className="relative bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden group">
        <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 z-10 p-1 bg-black/40 rounded-full text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <X size={12} />
        </button>
        <a href={currentAd.brandWebsite || '#'} target="_blank" rel="noopener noreferrer" onClick={() => incrementAdImpression(currentAd.id)}>
          <AdMedia src={currentAd.imageUrl} alt={currentAd.brandName} className="w-full aspect-[2/3] object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="text-white text-[10px] font-bold uppercase tracking-widest">{currentAd.brandName}</p>
          </div>
        </a>
      </div>
    );
  }

  // between_products or hero
  return (
    <div className="relative bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden group mb-10">
      <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 z-10 p-1.5 bg-black/40 rounded-full text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
      <a href={currentAd.brandWebsite || '#'} target="_blank" rel="noopener noreferrer" onClick={() => incrementAdImpression(currentAd.id)} className="block">
        <AdMedia src={currentAd.imageUrl} alt={currentAd.brandName} className="w-full aspect-[21/9] md:aspect-[3/1] object-cover" />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6">
          <div className="flex items-center gap-3">
            {currentAd.brandLogo && <img src={currentAd.brandLogo} alt="" className="h-8 w-8 rounded-full border border-gold/30" />}
            <div>
              <p className="text-white font-bold text-sm md:text-base">{currentAd.brandName}</p>
              {currentAd.description && <p className="text-gray-300 text-xs">{currentAd.description}</p>}
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}
