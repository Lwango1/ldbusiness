import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import AdForm from '../components/AdForm';

export default function AdPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black">
      <div className="max-w-3xl mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
          <Megaphone size={36} className="text-gold" />
        </div>
        <h1 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-4">
          Publicité LDBusiness
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto mb-10">
          Mettez votre marque en avant sur la première marketplace de luxe à Goma.
          Choisissez votre espace publicitaire et touchez des milliers de clients.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-6">
            <h3 className="text-gold font-bold text-sm mb-2">Bannière Hero</h3>
            <p className="text-gray-500 text-xs">En haut de la page d'accueil, visible immédiatement par tous les visiteurs.</p>
          </div>
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-6">
            <h3 className="text-gold font-bold text-sm mb-2">Entre les produits</h3>
            <p className="text-gray-500 text-xs">Carrousel publicitaire entre les articles de la collection.</p>
          </div>
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-6">
            <h3 className="text-gold font-bold text-sm mb-2">Pop-up</h3>
            <p className="text-gray-500 text-xs">Fenêtre contextuelle qui s'affiche selon la fréquence choisie.</p>
          </div>
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-6">
            <h3 className="text-gold font-bold text-sm mb-2">Bannière latérale</h3>
            <p className="text-gray-500 text-xs">Affichage discret sur le côté, visible sur desktop.</p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="px-10 py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all"
        >
          Faire une demande
        </button>

        {showForm && <AdForm onClose={() => setShowForm(false)} />}
      </div>
    </div>
  );
}
