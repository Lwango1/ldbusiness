import { Shield, Users, TrendingUp, Globe, Radio, Megaphone, Store, ShoppingBag } from 'lucide-react';

export default function AboutSection() {
  const values = [
    { icon: <Store className="text-gold" size={24} />, title: 'Multiples Boutiques', desc: 'Une marketplace qui regroupe vendeurs, artisans et créateurs en un seul endroit.' },
    { icon: <ShoppingBag className="text-gold" size={24} />, title: 'Achat & Vente', desc: 'Achetez et vendez en toute sécurité avec notre système de facturation intégré.' },
    { icon: <Radio className="text-gold" size={24} />, title: 'Showroom Live', desc: 'Présentez vos produits en direct et interagissez avec vos clients en temps réel.' },
    { icon: <Megaphone className="text-gold" size={24} />, title: 'Publicité Intégrée', desc: 'Promouvez votre marque avec nos espaces publicitaires (Hero, Pop-up, Carrousel, Sidebar).' },
  ];

  return (
    <section id="about" className="py-24 px-6 bg-luxury-dark relative overflow-hidden">
      <div className="absolute top-0 right-0 text-[15rem] font-playfair font-black text-white/[0.02] select-none pointer-events-none">
        LD
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Gauche - Identité Visuelle */}
          <div className="relative group">
            <div className="aspect-square max-w-sm md:max-w-md mx-auto relative flex items-center justify-center">
              <div className="absolute inset-0 border border-gold/10 rounded-full animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-4 border border-gold/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

              <div className="relative z-10 text-center p-8">
                <img src="/images/logo.png" alt="LDBusiness" className="h-24 md:h-32 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(201,169,78,0.4)]" />
                <div className="w-12 h-[1px] bg-gold/50 mx-auto mb-4" />
                <p className="font-playfair text-gold text-sm italic leading-relaxed">
                  "La plateforme qui connecte <br />vendeurs et acheteurs à Goma"
                </p>
                <p className="text-gray-600 text-[10px] uppercase tracking-widest mt-4">— LDBusiness Marketplace</p>
              </div>

              <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-gold/30" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-gold/30" />
            </div>
          </div>

          {/* Droite - Texte & Valeurs */}
          <div className="space-y-8">
            <div>
              <span className="text-gold text-[10px] uppercase tracking-[0.5em] font-bold">À Propos</span>
              <h2 className="font-playfair text-4xl md:text-6xl font-bold mt-4 leading-tight">
                <span className="gold-shimmer">Une plateforme</span>
                <br />
                <span className="text-white">tout-en-un</span>
              </h2>
            </div>

            <div className="space-y-4 text-gray-400 text-sm md:text-base leading-relaxed font-light">
              <p>
                <span className="text-white font-semibold">LDBusiness</span> est une <span className="text-gold">marketplace multi-usage</span> basée à Goma, Nord-Kivu.
                Contrairement aux plateformes classiques, nous ne nous limitons pas à l'achat et à la vente.
                Nous offrons un écosystème complet qui permet aux vendeurs de <span className="text-white">diffuser en direct</span> leurs produits,
                de <span className="text-white">promouvoir leur marque</span> via des espaces publicitaires intégrés,
                et de <span className="text-white">gérer leur boutique</span> en toute autonomie.
              </p>
              <p>
                Pour l'acheteur, c'est la garantie d'une <span className="text-white">expérience fluide et sécurisée</span> :
                catalogue varié de produits de mode, artisanat et services,
                live streaming pour voir les produits en action,
                paiement via Airtel Money, et livraison assurée partout en RDC.
              </p>
              <p>
                Notre mission est simple : <span className="text-white">faciliter le commerce local</span> en donnant aux entrepreneurs congolais les outils
                (boutique en ligne, live, publicité) pour développer leur activité et toucher plus de clients.
              </p>
            </div>

            {/* Grille des fonctionnalités */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {values.map((v, i) => (
                <div key={i} className="group p-5 bg-white/[0.02] border border-white/5 rounded-sm hover:border-gold/30 transition-all duration-500">
                  <div className="mb-3 transform group-hover:scale-110 transition-transform">{v.icon}</div>
                  <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2">{v.title}</h3>
                  <p className="text-gray-500 text-[11px] leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>

            {/* Statistiques */}
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
                <div className="text-2xl font-bold text-white">Live</div>
                <div className="text-[9px] text-gold uppercase tracking-tighter">Showroom</div>
              </div>
              <div className="w-px h-8 bg-gold/20" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Pub</div>
                <div className="text-[9px] text-gold uppercase tracking-tighter">4 Zones</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
