import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Share2 } from 'lucide-react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
      setIsInstalled(true);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LDBusiness - Marketplace de Luxe Goma',
          text: 'Découvrez LDBusiness : Mode, Artisanat et Création à Goma',
          url: window.location.origin,
        });
      } catch {}
    }
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[300] p-4 pb-6 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-md mx-auto bg-luxury-dark border border-gold/20 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
            <Smartphone size={22} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-bold text-sm">LDBusiness</h3>
              <button onClick={() => setShowBanner(false)} className="p-1 text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <p className="text-gray-400 text-[11px]">Installez l'application pour une meilleure expérience</p>
            <div className="flex gap-2 mt-3">
              <button onClick={handleInstall} className="flex-1 py-2.5 bg-gold text-black font-bold text-[10px] uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all flex items-center justify-center gap-1.5">
                <Download size={14} /> Installer
              </button>
              <button onClick={handleShare} className="px-3 py-2.5 border border-gold/30 text-gold text-[10px] rounded-sm hover:bg-gold/10 transition-all">
                <Share2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
