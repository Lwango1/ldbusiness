import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Store, Shield, RefreshCw } from 'lucide-react';
import { getSeller } from '../services/database';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { isAdminAuthenticated } from '../components/AdminGuard';
import SellerRegistration from '../components/SellerRegistration';
import SellerDashboard from '../components/SellerDashboard';
import AuthModal from '../components/AuthModal';

const ADMIN_EMAIL = 'lwangodany@gmail.com';
const ADMIN_PASSWORD = 'Admin@151191';
const ADMIN_AUTH_KEY = 'ldbusiness_admin_supabase_ready';

export default function SellerPage() {
  const { user, role, refresh } = useAuth();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const adminAuthed = isAdminAuthenticated();

  useEffect(() => {
    if (user) {
      getSeller(user.id).then(s => { setSeller(s); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (adminAuthed && !user && !connecting && localStorage.getItem(ADMIN_AUTH_KEY) !== 'done') {
      setConnecting(true);
      setConnectError('');
      (async () => {
        let signedIn = false;
        try {
          await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
          signedIn = true;
        } catch (e1: any) {
          const msg = e1?.message || '';
          if (msg.includes('Invalid login') || msg.includes('user not found')) {
            try {
              const { error } = await supabase.auth.signUp({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                options: { data: { full_name: 'Administrateur', role: 'seller', phone: '+243996710821' } },
              });
              if (!error) {
                await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
                signedIn = true;
              } else {
                setConnectError(error.message);
              }
            } catch (e2: any) {
              setConnectError(e2?.message || 'Erreur inconnue');
            }
          } else {
            setConnectError(msg);
          }
        }
        if (signedIn) {
          const u = await supabase.auth.getUser();
          if (u.data?.user) {
            localStorage.setItem(ADMIN_AUTH_KEY, 'done');
            await refresh();
          }
        }
        setConnecting(false);
      })();
    }
  }, [adminAuthed, user]);

  const handleSellerRegistered = async () => {
    if (user) { const s = await getSeller(user.id); setSeller(s); }
  };

  if (loading || connecting) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black flex items-start justify-center">
        <div className="max-w-sm w-full mt-20 text-center">
          <RefreshCw size={32} className="mx-auto text-gold/40 mb-4 animate-spin" />
          <p className="text-gray-500 text-sm">{connectError || 'Connexion en cours...'}</p>
        </div>
      </div>
    );
  }

  if (connectError && adminAuthed && !user) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black flex items-start justify-center">
        <div className="max-w-sm w-full mt-20 text-center">
          <Shield size={48} className="mx-auto text-gold/30 mb-4" />
          <h1 className="font-playfair text-2xl font-bold text-white mb-2">Erreur de connexion</h1>
          <p className="text-gray-500 text-sm mb-6">{connectError}</p>
          <button onClick={() => { localStorage.removeItem(ADMIN_AUTH_KEY); setConnectError(''); setConnecting(true); }} className="px-6 py-3 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

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

  return <SellerRegistration onRegistered={handleSellerRegistered} />;
}
