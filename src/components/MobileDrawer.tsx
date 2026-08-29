import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Crown, ShoppingBag, User, LogOut, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getActiveLives } from '../services/database';
import { useTranslation } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';

const DRAWER_WIDTH = 280;

interface MobileDrawerProps {
  onClose: () => void;
  onOpenAuth: () => void;
}

export default function MobileDrawer({ onClose, onOpenAuth }: MobileDrawerProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated, role, signOut } = useAuth();
  const location = useLocation();
  const [hasActiveLive, setHasActiveLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const lives = await getActiveLives();
        if (!cancelled) setHasActiveLive(lives.length > 0);
      } catch (err) {
        console.error('Live check error:', err);
      }
    };
    check();
    const interval = setInterval(check, 8000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const navItems = [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.products'), path: '/produits' },
    { label: t('nav.connections'), path: '/connexions' },
    { label: 'Demandes', path: '/demandes' },
    { label: t('nav.about'), path: '/a-propos' },
    { label: t('nav.live'), path: '/live' },
    { label: t('nav.sell'), path: '/vendre' },
    { label: t('nav.subscription'), path: '/abonnement' },
    ...(isAuthenticated ? [{ label: t('nav.myOrders'), path: '/mes-commandes' }] : []),
    ...(role === 'admin' ? [{ label: t('nav.admin'), path: '/admin' }] : []),
  ];

  return (
    <div
      className="fixed top-0 left-0 h-full bg-luxury-dark border-r border-gold/10 flex flex-col shadow-2xl z-50 animate-in slide-in-from-left"
      style={{ width: DRAWER_WIDTH }}
    >
      <div className="flex items-center justify-between p-4 border-b border-gold/10">
        <span className="font-playfair text-gold text-lg font-bold tracking-widest">{t('nav.menu')}</span>
        <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`block px-4 py-3 rounded-sm text-sm transition-all ${
              location.pathname === item.path
                ? 'text-gold bg-gold/5 border-l-2 border-gold'
                : 'text-gray-300 hover:text-gold hover:bg-gold/5'
            }`}
          >
            {item.label}
            {item.path === '/live' && hasActiveLive && (
              <span className="ml-2 inline-flex items-center gap-1 bg-red-600 px-1.5 py-0.5 rounded-sm">
                <span className="w-1 h-1 bg-white rounded-full animate-ping" />
                <span className="text-white text-[8px] font-black">{t('nav.liveBadge')}</span>
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-gold/10 space-y-2">
        <LanguageSwitcher />
        {isAuthenticated ? (
          <>
            <button onClick={() => { signOut(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-sm transition-all">
              <LogOut size={16} /> {t('nav.disconnect')}
            </button>
            <div className="px-4 py-2 text-[10px] text-gray-500 uppercase tracking-widest">
              {user?.user_metadata?.full_name || t('nav.user')}
            </div>
          </>
        ) : (
          <button onClick={() => { onOpenAuth(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gold hover:bg-gold/5 rounded-sm transition-all">
            <User size={16} /> {t('nav.loginRegister')}
          </button>
        )}
      </div>
    </div>
  );
}