import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Store, Shield } from 'lucide-react';
import { getSeller } from '../services/database';
import { supabase } from '../lib/supabase';
import SellerRegistration from '../components/SellerRegistration';
import SellerDashboard from '../components/SellerDashboard';
import AuthModal from '../components/AuthModal';

export default function SellerPage() {
  const { user, role } = useAuth();
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      let s = await getSeller(user.id);
      if (!s) {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          role: user.user_metadata?.role || 'buyer',
        }, { onConflict: 'id' });
        s = await getSeller(user.id);
      }
      if (!cancelled) { setSeller(s); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleAuthSuccess = () => {
    setShowAuth(false);
  };

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
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />}
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
