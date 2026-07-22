import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, LogOut, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 280;

interface MobileDrawerProps {
  onClose: () => void;
  onOpenAuth: () => void;
}

export default function MobileDrawer({ onClose, onOpenAuth }: MobileDrawerProps) {
  const { user, isAuthenticated, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Produits', path: '/produits' },
    { label: 'À Propos', path: '/a-propos' },
    { label: 'Live', path: '/live' },
    { label: 'Contact', path: '/contact' },
    { label: 'Vendre', path: '/vendre' },
    ...(isAuthenticated ? [{ label: 'Mes Commandes', path: '/mes-commandes' }] : []),
  ];

  return (
    <div
      className="fixed top-0 left-0 h-full bg-luxury-dark border-r border-gold/10 flex flex-col shadow-2xl z-50 animate-in slide-in-from-left"
      style={{ width: DRAWER_WIDTH }}
    >
      <div className="flex items-center justify-between p-4 border-b border-gold/10">
        <span className="font-playfair text-gold text-lg font-bold tracking-widest">Menu</span>
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
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-gold/10 space-y-2">
        {isAuthenticated ? (
          <>
            <button onClick={() => { signOut(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-sm transition-all">
              <LogOut size={16} /> Déconnexion
            </button>
            <div className="px-4 py-2 text-[10px] text-gray-500 uppercase tracking-widest">
              {user?.user_metadata?.full_name || 'Utilisateur'}
            </div>
          </>
        ) : (
          <button onClick={() => { onOpenAuth(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gold hover:bg-gold/5 rounded-sm transition-all">
            <User size={16} /> Connexion / Inscription
          </button>
        )}
      </div>
    </div>
  );
}