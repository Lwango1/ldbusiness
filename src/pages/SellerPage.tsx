import { useState, useEffect } from 'react';
import { Store, KeyRound, Lock, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSeller, registerSeller } from '../services/database';
import { Seller } from '../types';
import { sha256, ADMIN_HASH } from '../components/AdminGuard';
import SellerRegistration from '../components/SellerRegistration';
import SellerDashboard from '../components/SellerDashboard';

const SELLER_PIN_KEY = 'ldbusiness_seller_auth';

export default function SellerPage() {
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinMode, setPinMode] = useState(false);
  const [pin, setPin] = useState(Array(6).fill(''));
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinVerified, setPinVerified] = useState(sessionStorage.getItem(SELLER_PIN_KEY) === 'true');
  const [sellerReady, setSellerReady] = useState(false);

  useEffect(() => {
    if (user) {
      getSeller(user.id).then(s => { setSeller(s); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [user]);

  const handlePinDigit = (idx: number, val: string) => {
    if (val.length > 1) return;
    const newPin = [...pin];
    newPin[idx] = val.replace(/[^0-9]/g, '');
    setPin(newPin);
    setPinError('');
    if (newPin[idx] && idx < 5) {
      document.getElementById(`sp-${idx + 1}`)?.focus();
    }
  };

  const handlePinKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
      document.getElementById(`sp-${idx - 1}`)?.focus();
    }
    if (e.key === 'Enter') handlePinSubmit();
  };

  const handlePinSubmit = async () => {
    const fullPin = pin.join('');
    if (fullPin.length !== 6) { setPinError('Code à 6 chiffres requis'); return; }
    setPinLoading(true);
    const hash = await sha256(fullPin);
    if (hash === ADMIN_HASH) {
      sessionStorage.setItem(SELLER_PIN_KEY, 'true');
      setPinVerified(true);
      if (user) {
        const existing = await getSeller(user.id);
        if (!existing || existing.storeName === 'Boutique LDBusiness') {
          await registerSeller(user.id, { storeName: 'Ma Boutique' });
          const s = await getSeller(user.id);
          setSeller(s);
        }
        setSellerReady(true);
      }
    } else {
      setPinError('Code incorrect');
      setPin(Array(6).fill(''));
      document.getElementById('sp-0')?.focus();
    }
    setPinLoading(false);
  };

  if (loading) return null;

  if (pinVerified && user && (sellerReady || (seller && seller.storeName !== 'Boutique LDBusiness'))) {
    return <SellerDashboard seller={seller!} />;
  }

  if (pinVerified && user && !sellerReady && (!seller || seller.storeName === 'Boutique LDBusiness')) {
    return <SellerRegistration onRegistered={async () => { const s = await getSeller(user.id); setSeller(s); setSellerReady(true); }} />;
  }

  if (pinMode || (!user && !pinVerified)) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black flex items-start justify-center">
        <div className="max-w-sm w-full mt-20">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-5">
              {user ? <Store size={36} className="text-gold" /> : <Shield size={36} className="text-gold" />}
            </div>
            <h1 className="font-playfair text-3xl font-bold text-white mb-2">
              {user ? 'Devenir Vendeur' : 'Accès Vendeur'}
            </h1>
            <p className="text-gray-500 text-sm">Entrez le code secret à 6 chiffres</p>
          </div>

          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-8">
            <div className="flex justify-center gap-2 md:gap-3 mb-8">
              {pin.map((d, i) => (
                <input
                  key={i}
                  id={`sp-${i}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handlePinDigit(i, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(i, e)}
                  className={`w-10 md:w-14 h-12 md:h-16 text-center text-lg md:text-2xl font-bold bg-black border-2 rounded-sm outline-none transition-all ${
                    d ? 'border-gold text-gold' : 'border-gold/20 text-white'
                  }`}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {pinError && (
              <p className="text-red-500 text-xs text-center mb-4 flex items-center justify-center gap-1">
                <Lock size={12} /> {pinError}
              </p>
            )}

            <button
              onClick={handlePinSubmit}
              disabled={pinLoading || pin.join('').length !== 6}
              className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {pinLoading ? (
                <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Vérification...</>
              ) : (
                <><KeyRound size={16} /> Déverrouiller</>
              )}
            </button>

            {!user && (
              <p className="text-center mt-4 text-gray-500 text-xs">
                Vous devez être connecté pour gérer les produits.
              </p>
            )}
          </div>
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
          <button onClick={() => setPinMode(true)} className="px-6 py-3 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm">
            J'ai un code secret
          </button>
        </div>
      </div>
    );
  }

  return <SellerRegistration onRegistered={async () => { if (user) { const s = await getSeller(user.id); setSeller(s); } }} />;
}
