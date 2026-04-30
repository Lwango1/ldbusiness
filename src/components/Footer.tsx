import * as LucideIcons from 'lucide-react';

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
            <img src="/images/logo.png" alt="Levine Mande" className="h-16 object-contain" />
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-[#C9A94E]/20 flex items-center justify-center text-[#C9A94E] hover:bg-[#C9A94E] hover:text-black transition-all">
                <Icon name="Instagram" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-[#C9A94E]/20 flex items-center justify-center text-[#C9A94E] hover:bg-[#C9A94E] hover:text-black transition-all">
                <Icon name="Facebook" />
              </a>
            </div>
          </div>

          {/* Autres colonnes... */}
          <div>
             <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
               <Icon name="MapPin" size={14} /> Showroom
             </h4>
             <p className="text-gray-500 text-xs">Gombe, Kinshasa, RDC</p>
          </div>

        </div>
      </div>
    </footer>
  );
}