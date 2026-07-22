import { useState } from 'react';
import { X, Phone, Lock, User, Store, Shield, KeyRound, Eye, EyeOff } from 'lucide-react';
import { signUp, signIn, getCurrentUser, UserRole } from '../services/auth';
import { sha256, ADMIN_HASH } from './AdminGuard';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('buyer');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPin, setAdminPin] = useState(Array(6).fill(''));
  const [adminCredentials, setAdminCredentials] = useState<{ phone: string; password: string } | null>(null);

  const handlePinDigit = (idx: number, val: string) => {
    if (val.length > 1) return;
    const newPin = [...adminPin];
    newPin[idx] = val.replace(/[^0-9]/g, '');
    setAdminPin(newPin);
    setError('');
    if (newPin[idx] && idx < 5) {
      document.getElementById(`ap-${idx + 1}`)?.focus();
    }
  };

  const handlePinKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !adminPin[idx] && idx > 0) {
      document.getElementById(`ap-${idx - 1}`)?.focus();
    }
    if (e.key === 'Enter') handleAdminLogin();
  };

  const handleAdminLogin = async () => {
    const fullPin = adminPin.join('');
    if (fullPin.length !== 6) { setError('Code à 6 chiffres requis'); return; }
    setLoading(true);
    setError('');
    try {
      const hash = await sha256(fullPin);
      if (hash !== ADMIN_HASH) { setError('Code secret incorrect'); setAdminPin(Array(6).fill('')); document.getElementById('ap-0')?.focus(); setLoading(false); return; }

      const ADMIN_PHONE = '+243800000001';
      const stored = localStorage.getItem('ldbusiness_admin_creds');
      let password = stored ? JSON.parse(stored).password : 'Admin@' + Math.random().toString(36).slice(2, 8);

      try {
        await signIn(ADMIN_PHONE, password);
      } catch {
        try {
          await signUp(ADMIN_PHONE, password, 'Administrateur', 'admin');
        } catch (e: any) {
          if (e?.message?.includes('already') || e?.message?.includes('exists')) {
            setError('Compte admin déjà existant. Contactez le support.');
            setLoading(false);
            return;
          }
          if (!e?.message?.includes('rate')) throw e;
          setError('Trop de tentatives. Attendez quelques minutes puis réessayez.');
          setLoading(false);
          return;
        }
        await signIn(ADMIN_PHONE, password);
        localStorage.setItem('ldbusiness_admin_creds', JSON.stringify({ phone: ADMIN_PHONE, password }));
      }

      for (let i = 0; i < 20; i++) {
        const u = await getCurrentUser();
        if (u) { onSuccess(); return; }
        await new Promise(r => setTimeout(r, 200));
      }
      setError('Connecté, veuillez rafraîchir');
    } catch (err: any) {
      setError(err.message || 'Échec de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!fullName || !phone || !password) {
          setError('Tous les champs sont obligatoires');
          setLoading(false);
          return;
        }
        const data = await signUp(phone, password, fullName, role);
        if (!data.session) {
          await signIn(phone, password);
        }
      } else {
        if (!phone || !password) {
          setError('Téléphone et mot de passe requis');
          setLoading(false);
          return;
        }
        await signIn(phone, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-luxury-dark border border-gold/20 rounded-xl p-8 max-w-md w-full shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-3">
            {mode === 'login' ? <Lock size={24} className="text-gold" /> : <User size={24} className="text-gold" />}
          </div>
          <h2 className="font-playfair text-xl text-white font-bold">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
          <p className="text-gray-500 text-xs mt-1">Utilisez votre numéro de téléphone</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'login' && adminMode ? (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <Shield size={32} className="mx-auto text-gold mb-2" />
                <p className="text-gray-400 text-xs">Code secret admin</p>
              </div>
              <div className="flex justify-center gap-2">
                {adminPin.map((d, i) => (
                  <input
                    key={i}
                    id={`ap-${i}`}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handlePinDigit(i, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(i, e)}
                    className={`w-10 h-12 text-center text-lg font-bold bg-black border-2 rounded-sm outline-none transition-all ${
                      d ? 'border-gold text-gold' : 'border-gold/20 text-white'
                    }`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <button type="button" onClick={handleAdminLogin} disabled={loading || adminPin.join('').length !== 6} className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                {loading ? 'Connexion...' : <><KeyRound size={16} /> Connexion Admin</>}
              </button>
              <button type="button" onClick={() => { setAdminMode(false); setError(''); setAdminPin(Array(6).fill('')); }} className="w-full py-2 text-gray-500 text-xs hover:text-gold transition-all">
                Retour à la connexion normale
              </button>
            </div>
          ) : (
            <>
          {mode === 'register' && (
            <div>
              <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Nom complet</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ex: Daniel Lwango" className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Téléphone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+243 XX XXX XXXX" className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Mot de passe</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-12 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Je suis</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRole('buyer')} className={`py-3 px-4 text-xs rounded-sm border transition-all flex items-center justify-center gap-2 ${role === 'buyer' ? 'bg-gold text-black border-gold' : 'border-gold/20 text-gray-400 hover:border-gold/40'}`}>
                  <User size={14} /> Acheteur
                </button>
                <button type="button" onClick={() => setRole('seller')} className={`py-3 px-4 text-xs rounded-sm border transition-all flex items-center justify-center gap-2 ${role === 'seller' ? 'bg-gold text-black border-gold' : 'border-gold/20 text-gray-400 hover:border-gold/40'}`}>
                  <Store size={14} /> Vendeur
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="text-center">
              <button type="button" onClick={() => setAdminMode(true)} className="text-gold text-xs hover:underline flex items-center justify-center gap-1 mx-auto">
                <Shield size={12} /> Connexion Admin
              </button>
            </div>
          )}
          </>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}

          {!(mode === 'login' && adminMode) && (
          <button type="submit" disabled={loading} className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30">
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
          )}
        </form>

        <p className="text-center mt-6 text-gray-500 text-xs">
          {mode === 'login' ? "Pas encore de compte ? " : "Déjà un compte ? "}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="text-gold hover:underline">
            {mode === 'login' ? 'S\'inscrire' : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  );
}
