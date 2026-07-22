import { useState, useEffect } from 'react';
import { Store, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSeller } from '../services/database';
import { Seller } from '../types';
import SellerRegistration from '../components/SellerRegistration';
import SellerDashboard from '../components/SellerDashboard';
import AuthModal from '../components/AuthModal';

export default function SellerPage() {
  const { user, role } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (user) {
      getSeller(user.id).then(s => { setSeller(s); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black flex items-start justify-center">
        <div className="max-w-sm w-full mt-20 text-center">
          <Store size={48} className="mx-auto text-gold/30 mb-4" />
          <h1 className="font-playfair text-2xl font-bold text-white mb-2">Connexion requise</h1>
          <p className="text-gray-500 text-sm mb-6">Connectez-vous pour accéder à votre espace vendeur.</p>
          <button onClick={() => setShowAuth(true)} className="px-6 py-3 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm">
            Se connecter
          </button>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
      </div>
    );
  }

  if (role === 'buyer') {
    return (
      <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black flex items-start justify-center">
        <div className="max-w-sm w-full mt-20 text-center">
          <Shield size={48} className="mx-auto text-red-500/40 mb-4" />
          <h1 className="font-playfair text-2xl font-bold text-white mb-2">Accès refusé</h1>
          <p className="text-gray-500 text-sm">Vous êtes inscrit en tant qu'acheteur. Créez un compte vendeur pour accéder à cet espace.</p>
        </div>
      </div>
    );
  }

  if (seller && seller.storeName !== 'Boutique LDBusiness') {
    return <SellerDashboard seller={seller} />;
  }

  return <SellerRegistration onRegistered={async () => { if (user) { const s = await getSeller(user.id); setSeller(s); } }} />;
}
