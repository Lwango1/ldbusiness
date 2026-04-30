import { ChevronDown, Sparkles } from 'lucide-react';

interface HeroProps {
  onNavigate: (section: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  return (
    <section id="hero" className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-luxury-black">
      {/* Background image with optimized overlay */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-bg.jpg" // Assure-toi que ce fichier est dans public/images/
          alt="Luxury Fashion"
          className="w-full h-full object-cover opacity-60"
        />
        {/* Gradient plus profond pour assurer la lisibilité du texte sur mobile */}
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/90 via-transparent to-luxury-black" />
      </div>

      {/* Particules décoratives (Moins nombreuses pour ne pas ralentir l'APK) */}
      <div className="absolute top-[15%] left-[5%] w-24 h-24 border border-gold/10 rounded-full animate-pulse pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-16 h-16 border border-gold/10 rounded-full animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="relative z-10 text-center px-6 w-full max-w-5xl mx-auto">

        {/* Logo Levine Mande - Redimensionné pour Mobile */}
        <div className="mb-6 md:mb-10">
          <img
            src="/images/logo.png"
            alt="Levine Mande"
            className="h-24 sm:h-32 md:h-44 mx-auto object-contain drop-shadow-[0_0_15px_rgba(201,169,78,0.3)] transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* Ligne de séparation élégante */}
        <div className="flex items-center justify-center gap-3 mb-6 md:mb-8">
          <div className="w-10 md:w-20 h-[1px] bg-gradient-to-r from-transparent to-gold" />
          <Sparkles className="text-gold" size={16} />
          <div className="w-10 md:w-20 h-[1px] bg-gradient-to-l from-transparent to-gold" />
        </div>

        {/* Titre Principal avec effet Shimmer */}
        <h1 className="font-playfair text-4xl sm:text-5xl md:text-7xl font-bold mb-4 leading-tight">
          <span className="gold-shimmer block">L'Élégance</span>
          <span className="text-white">Redéfinie</span>
        </h1>

        <p className="font-poppins text-gray-400 text-sm md:text-lg max-w-xl mx-auto mb-10 leading-relaxed uppercase tracking-[0.1em]">
          Event Creation <span className="mx-2 text-gold">•</span> Vente & Habillement de Luxe
          <br />
          <span className="text-[10px] text-gray-500 font-light mt-2 block">Kinshasa, République Démocratique du Congo</span>
        </p>

        {/* Boutons d'appel à l'action (CTA) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => onNavigate('products')}
            className="w-full sm:w-auto px-10 py-4 bg-gold text-black font-black rounded-sm tracking-widest uppercase text-[11px] shadow-2xl shadow-gold/10 active:scale-95 transition-all"
          >
            Découvrir la Collection
          </button>

          <button
            onClick={() => onNavigate('live')}
            className="w-full sm:w-auto px-10 py-4 border border-gold/40 text-gold font-bold rounded-sm tracking-widest uppercase text-[11px] backdrop-blur-md hover:bg-gold/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
            Showroom Live
          </button>
        </div>
      </div>

      {/* Indicateur de défilement (Scroll) */}
      <button
        onClick={() => onNavigate('products')}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gold/30 hover:text-gold transition-all animate-bounce hidden sm:block"
      >
        <ChevronDown size={40} strokeWidth={1} />
      </button>
    </section>
  );
}