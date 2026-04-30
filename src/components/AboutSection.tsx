import { Award, Heart, Gem, Star } from 'lucide-react';

export default function AboutSection() {
  const values = [
    { icon: <Gem className="text-gold" size={24} />, title: 'Luxe Authentique', desc: 'Matériaux premium sélectionnés avec rigueur.' },
    { icon: <Heart className="text-gold" size={24} />, title: 'Passion Pure', desc: 'Chaque point de couture raconte une histoire.' },
    { icon: <Award className="text-gold" size={24} />, title: 'Excellence RDC', desc: 'Le savoir-faire de Kinshasa élevé au rang d\'art.' },
    { icon: <Star className="text-gold" size={24} />, title: 'Sur Mesure', desc: 'Une personnalisation totale pour chaque client.' },
  ];

  return (
    <section id="about" className="py-24 px-6 bg-luxury-dark relative overflow-hidden">
      {/* Filigrane décoratif en arrière-plan */}
      <div className="absolute top-0 right-0 text-[15rem] font-playfair font-black text-white/[0.02] select-none pointer-events-none">
        LM
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Gauche - Identité Visuelle */}
          <div className="relative group">
            <div className="aspect-square max-w-sm md:max-w-md mx-auto relative flex items-center justify-center">
              {/* Cercles concentriques animés */}
              <div className="absolute inset-0 border border-gold/10 rounded-full animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-4 border border-gold/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

              {/* Contenu Central */}
              <div className="relative z-10 text-center p-8">
                <img
                  src="/images/logo.png"
                  alt="Levine Mande"
                  className="h-24 md:h-32 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(201,169,78,0.4)]"
                />
                <div className="w-12 h-[1px] bg-gold/50 mx-auto mb-4" />
                <p className="font-playfair text-gold text-sm italic leading-relaxed">
                  "L'élégance est la seule beauté <br />qui ne se fane jamais"
                </p>
                <p className="text-gray-600 text-[10px] uppercase tracking-widest mt-4">— Maison Levine Mande</p>
              </div>

              {/* Accents de coins de luxe */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-gold/30" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-gold/30" />
            </div>
          </div>

          {/* Droite - Texte & Valeurs */}
          <div className="space-y-8">
            <div>
              <span className="text-gold text-[10px] uppercase tracking-[0.5em] font-bold">L'Héritage</span>
              <h2 className="font-playfair text-4xl md:text-6xl font-bold mt-4 leading-tight">
                <span className="gold-shimmer">La Maison</span>
                <br />
                <span className="text-white">Levine Mande</span>
              </h2>
            </div>

            <div className="space-y-4 text-gray-400 text-sm md:text-base leading-relaxed font-light">
              <p>
                Née au cœur de <span className="text-white font-semibold">Kinshasa</span>, la Maison Levine Mande incarne l'apogée de la mode congolaise contemporaine. Nous fusionnons l'audace des textiles africains avec la précision de la haute couture internationale.
              </p>
              <p>
                Plus qu'une boutique, nous sommes des créateurs d'émotions. De la robe de gala sculptée à la main à l'organisation d'événements de prestige, chaque projet est traité comme une pièce unique.
              </p>
            </div>

            {/* Grille de Valeurs optimisée pour APK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {values.map((v, i) => (
                <div key={i} className="group p-5 bg-white/[0.02] border border-white/5 rounded-sm hover:border-gold/30 transition-all duration-500">
                  <div className="mb-3 transform group-hover:scale-110 transition-transform">{v.icon}</div>
                  <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2">{v.title}</h3>
                  <p className="text-gray-500 text-[11px] leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>

            {/* Statistiques d'Excellence */}
            <div className="flex justify-between items-center pt-8 border-t border-gold/10">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-[9px] text-gold uppercase tracking-tighter">Clients</div>
              </div>
              <div className="w-px h-8 bg-gold/20" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">200+</div>
                <div className="text-[9px] text-gold uppercase tracking-tighter">Événements</div>
              </div>
              <div className="w-px h-8 bg-gold/20" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">5</div>
                <div className="text-[9px] text-gold uppercase tracking-tighter">Années</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}