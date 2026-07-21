import { Shield, Users, TrendingUp, Globe } from 'lucide-react';

export default function AboutSection() {
  const values = [
    { icon: <Shield className="text-gold" size={24} />, title: 'Transactions Sécurisées', desc: 'Chaque achat est protégé par notre système de facturation intégré.' },
    { icon: <Users className="text-gold" size={24} />, title: 'Multiples Vendeurs', desc: 'Des centaines de boutiques et artisans réunis sur une seule plateforme.' },
    { icon: <TrendingUp className="text-gold" size={24} />, title: 'Croissance Locale', desc: 'Nous boostons l\'économie de Goma et du Nord-Kivu.' },
    { icon: <Globe className="text-gold" size={24} />, title: 'Livraison Partout', desc: 'De Goma vers toute la RDC, nous assurons la livraison.' },
  ];

  return (
    <section id="about" className="py-24 px-6 bg-luxury-dark relative overflow-hidden">
      {/* Filigrane décoratif en arrière-plan */}
      <div className="absolute top-0 right-0 text-[15rem] font-playfair font-black text-white/[0.02] select-none pointer-events-none">
        LD
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
                  alt="LDBusiness"
                  className="h-24 md:h-32 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(201,169,78,0.4)]"
                />
                <div className="w-12 h-[1px] bg-gold/50 mx-auto mb-4" />
                <p className="font-playfair text-gold text-sm italic leading-relaxed">
                  "La plateforme qui connecte <br />vendeurs et acheteurs à Goma"
                </p>
                <p className="text-gray-600 text-[10px] uppercase tracking-widest mt-4">— LDBusiness Marketplace</p>
              </div>

              {/* Accents de coins de luxe */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-gold/30" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-gold/30" />
            </div>
          </div>

          {/* Droite - Texte & Valeurs */}
          <div className="space-y-8">
            <div>
              <span className="text-gold text-[10px] uppercase tracking-[0.5em] font-bold">La Plateforme</span>
              <h2 className="font-playfair text-4xl md:text-6xl font-bold mt-4 leading-tight">
                <span className="gold-shimmer">LDBusiness</span>
                <br />
                <span className="text-white">Marketplace</span>
              </h2>
            </div>

            <div className="space-y-4 text-gray-400 text-sm md:text-base leading-relaxed font-light">
              <p>
                Basée à <span className="text-white font-semibold">Goma, Nord-Kivu</span>, LDBusiness est la première marketplace congolaise dédiée à la mode, l'artisanat et les services de luxe. Nous mettons en relation des vendeurs locaux avec des acheteurs du monde entier.
              </p>
              <p>
                Notre mission est de créer un écosystème commercial fiable où chaque transaction est sécurisée, chaque produit est vérifié, et chaque vendeur peut développer son activité en toute confiance. Nous gérons la logistique et la livraison pour garantir une expérience fluide.
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
                <div className="text-2xl font-bold text-white">100+</div>
                <div className="text-[9px] text-gold uppercase tracking-tighter">Vendeurs</div>
              </div>
              <div className="w-px h-8 bg-gold/20" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">300+</div>
                <div className="text-[9px] text-gold uppercase tracking-tighter">Produits</div>
              </div>
              <div className="w-px h-8 bg-gold/20" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Goma</div>
                <div className="text-[9px] text-gold uppercase tracking-tighter">Nord-Kivu</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}