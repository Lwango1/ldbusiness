import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getMySubscriptions } from '../services/database';

export default function SubscriptionAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alert, setAlert] = useState<{ type: 'expiring' | 'expired'; endDate: Date } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const check = async () => {
      try {
        const subs = await getMySubscriptions(user.id);
        const active = subs.find(s => s.status === 'active');
        if (!active || !active.endDate) return;

        const now = new Date();
        const end = new Date(active.endDate);
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) {
          if (!cancelled) setAlert({ type: 'expired', endDate: end });
        } else if (daysLeft <= 2) {
          if (!cancelled) setAlert({ type: 'expiring', endDate: end });
        } else {
          if (!cancelled) setAlert(null);
        }
      } catch (err) {
        console.error('SubscriptionAlert error:', err);
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);

  if (!alert) return null;

  return (
    <div className={`px-4 py-3 flex items-center justify-between gap-3 text-sm ${
      alert.type === 'expired'
        ? 'bg-red-600/20 border-b border-red-500/30'
        : 'bg-yellow-600/20 border-b border-yellow-500/30'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        {alert.type === 'expired' ? (
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
        ) : (
          <Crown size={16} className="text-yellow-400 shrink-0" />
        )}
        <span className={`text-xs ${alert.type === 'expired' ? 'text-red-300' : 'text-yellow-300'}`}>
          {alert.type === 'expired'
            ? `Votre abonnement a expiré le ${alert.endDate.toLocaleDateString('fr-FR')}. Renouvelez pour continuer à utiliser le live et la publicité.`
            : `Votre abonnement expire le ${alert.endDate.toLocaleDateString('fr-FR')} (dans ${Math.ceil((alert.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} jour${Math.ceil((alert.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''}). Renouvelez dès maintenant.`
          }
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate('/abonnement')}
          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm transition-all ${
            alert.type === 'expired'
              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
              : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
          }`}
        >
          Renouveler
        </button>
        <button onClick={() => setAlert(null)} className="text-gray-500 hover:text-white p-1">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
