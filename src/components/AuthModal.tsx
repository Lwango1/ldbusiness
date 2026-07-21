import { useState } from 'react';
import { X, Phone, Lock, User, Store, Eye, EyeOff } from 'lucide-react';
import { signUp, signIn, UserRole } from '../services/auth';

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
        await signUp(phone, password, fullName, role);
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

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button type="submit" disabled={loading} className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30">
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
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
