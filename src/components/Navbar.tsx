import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
}

export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMenuOpen) {
      window.history.pushState(null, '', window.location.pathname);
      const handlePopState = () => setIsMenuOpen(false);
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isMenuOpen]);

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
    <>
      <nav className="sticky top-0 z-50 bg-luxury-black/95 backdrop-blur-md border-b border-gold/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="LDBusiness" className="h-10 md:h-14 object-contain" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm uppercase tracking-wider transition-all ${
                  location.pathname === item.path ? 'text-gold' : 'text-gray-300 hover:text-gold'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button onClick={signOut} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-gray-400 hover:text-red-400 uppercase tracking-widest border border-gray-700/50 rounded-sm hover:border-red-500/30 transition-all">
                <LogOut size={12} /> {user?.user_metadata?.full_name?.split(' ')[0] || 'Quitter'}
              </button>
            ) : (
              <button onClick={() => setShowAuth(true)} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-gold uppercase tracking-widest border border-gold/30 rounded-sm hover:bg-gold/10 transition-all">
                <User size={12} /> Connexion
              </button>
            )}
            <button onClick={onCartClick} className="relative p-2 text-gold">
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gold">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
        </div>

        {isMenuOpen && (
          <div className="fixed inset-0 top-[65px] z-40 bg-luxury-black flex flex-col p-6 animate-in slide-in-from-right">
            <div className="flex flex-col gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-left py-4 text-2xl font-playfair border-b border-gold/10 transition-all ${
                    location.pathname === item.path ? 'text-gold' : 'text-gray-200'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 space-y-4">
                {isAuthenticated && (
                  <Link to="/mes-commandes" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-gold text-sm">
                    <ShoppingBag size={16} /> Mes Commandes
                  </Link>
                )}
                {isAuthenticated ? (
                  <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-red-400 text-sm">
                    <LogOut size={16} /> Déconnexion
                  </button>
                ) : (
                  <button onClick={() => { setShowAuth(true); setIsMenuOpen(false); }} className="flex items-center gap-2 text-gold text-sm">
                    <User size={16} /> Connexion / Inscription
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}