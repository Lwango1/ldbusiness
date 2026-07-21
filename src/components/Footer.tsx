import * as LucideIcons from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Fonction de sécurité pour l'affichage des icônes
  const Icon = ({ name, size = 18 }: { name: keyof typeof LucideIcons, size?: number }) => {
    const LucideIcon = LucideIcons[name] as any;
    return LucideIcon ? <LucideIcon size={size} /> : null;
  };

  return (
    <footer className="bg-[#050505] border-t border-[#C9A94E]/10 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          <div className="space-y-6">
            <img src="/images/logo.png" alt="LDBusiness" className="h-16 object-contain" />
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-[#C9A94E]/20 flex items-center justify-center text-[#C9A94E] hover:bg-[#C9A94E] hover:text-black transition-all">
                <Icon name="Instagram" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-[#C9A94E]/20 flex items-center justify-center text-[#C9A94E] hover:bg-[#C9A94E] hover:text-black transition-all">
                <Icon name="Facebook" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
             <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
               <Icon name="Compass" size={14} /> Navigation
             </h4>
             <Link to="/" className="text-gray-500 text-xs hover:text-gold transition-colors block">Accueil</Link>
             <Link to="/produits" className="text-gray-500 text-xs hover:text-gold transition-colors block mt-2">Produits</Link>
             <Link to="/a-propos" className="text-gray-500 text-xs hover:text-gold transition-colors block mt-2">À Propos</Link>
             <Link to="/live" className="text-gray-500 text-xs hover:text-gold transition-colors block mt-2">Showroom Live</Link>
             <Link to="/contact" className="text-gray-500 text-xs hover:text-gold transition-colors block mt-2">Contact</Link>
          </div>

          <div>
             <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
               <Icon name="MapPin" size={14} /> Adresse
             </h4>
             <p className="text-gray-500 text-xs">Goma, Nord-Kivu, RDC</p>
          </div>

          <div>
             <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
               <Icon name="Shield" size={14} /> Plateforme
             </h4>
              <Link to="/vendre" className="text-gray-500 text-xs hover:text-gold transition-colors block">Devenir vendeur</Link>
              <Link to="/admin" className="text-gray-500 text-xs hover:text-gold transition-colors block mt-2">Administration</Link>
              <Link to="/publicite" className="text-gray-500 text-xs hover:text-gold transition-colors block mt-2">Publicité</Link>
          </div>

        </div>
      </div>
    </footer>
  );
}