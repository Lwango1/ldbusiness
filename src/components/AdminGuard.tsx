import { useState } from 'react';
import { Shield, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ADMIN_HASH = '628c7389fd25ae26a3c81380d330cbabd0f22163e1b402960b58e6767745cec2'; // SHA-256 de "151191"
const STORAGE_KEY = 'ldbusiness_admin_auth';

export function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return crypto.subtle.digest('SHA-256', data).then(buf => {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === 'true';
}

export function clearAdminAuth(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

const PIN_LENGTH = 6;

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const [pin, setPin] = useState(Array(PIN_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(isAdminAuthenticated() || role === 'admin');
  const [loading, setLoading] = useState(false);

  const handleDigit = (idx: number, val: string) => {
    if (val.length > 1) return;
    const newPin = [...pin];
    newPin[idx] = val.replace(/[^0-9]/g, '');
    setPin(newPin);
    setError('');

    if (newPin[idx] && idx < PIN_LENGTH - 1) {
      const next = document.getElementById(`pin-${idx + 1}`);
      next?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
      const prev = document.getElementById(`pin-${idx - 1}`);
      prev?.focus();
    }
    if (e.key === 'Enter') handleSubmit();
  };

  const handleSubmit = async () => {
    const fullPin = pin.join('');
    if (fullPin.length !== PIN_LENGTH) {
      setError(`Code à ${PIN_LENGTH} chiffres requis`);
      return;
    }
    setLoading(true);
    const hash = await sha256(fullPin);
    if (hash === ADMIN_HASH) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setVerified(true);
    } else {
      setError('Code incorrect');
      setPin(['', '', '', '']);
      document.getElementById('pin-0')?.focus();
    }
    setLoading(false);
  };

  if (verified) return <>{children}</>;

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black flex items-start justify-center">
      <div className="max-w-sm w-full mt-20">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-5">
            <Shield size={36} className="text-gold" />
          </div>
          <h1 className="font-playfair text-3xl font-bold text-white mb-2">Accès Admin</h1>
          <p className="text-gray-500 text-sm">Entrez le code secret à {PIN_LENGTH} chiffres</p>
        </div>

        <div className="bg-luxury-dark border border-gold/10 rounded-xl p-8">
          <div className="flex justify-center gap-2 md:gap-3 mb-8">
            {pin.map((d, i) => (
              <input
                key={i}
                id={`pin-${i}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-10 md:w-14 h-12 md:h-16 text-center text-lg md:text-2xl font-bold bg-black border-2 rounded-sm outline-none transition-all ${
                  d ? 'border-gold text-gold' : 'border-gold/20 text-white'
                }`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center mb-4 flex items-center justify-center gap-1">
              <Lock size={12} /> {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || pin.join('').length !== PIN_LENGTH}
            className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Vérification...</>
            ) : (
              <><KeyRound size={16} /> Déverrouiller</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
