import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getActiveLives } from '../services/database';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  isMobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
  onMobileMenuClose: () => void;
  showAuth: boolean;
  onAuthOpen: () => void;
  onAuthClose: () => void;
}

export default function Navbar({ cartCount, onCartClick, isMobileMenuOpen, onMobileMenuToggle, onMobileMenuClose, showAuth, onAuthOpen, onAuthClose }: NavbarProps) {
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

  useEffect(() => {
    onMobileMenuClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const navItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Produits', path: '/produits' },
    { label: 'À Propos', path: '/a-propos' },
    { label: 'Live', path: '/live' },
    { label: 'Contact', path: '/contact' },
    { label: 'Vendre', path: '/vendre' },
    ...(isAuthenticated ? [{ label: 'Mes Commandes', path: '/mes-commandes' }] : []),
    ...(role === 'admin' ? [{ label: 'Admin', path: '/admin' }] : []),
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
                  {item.path === '/live' && hasActiveLive && (
                    <span className="ml-1.5 inline-flex items-center gap-1 bg-red-600 px-1.5 py-0.5 rounded-sm">
                      <span className="w-1 h-1 bg-white rounded-full animate-ping" />
                      <span className="text-white text-[8px] font-black">LIVE</span>
                    </span>
                  )}
                </Link>
              ))}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button onClick={signOut} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-gray-400 hover:text-red-400 uppercase tracking-widest border border-gray-700/50 rounded-sm hover:border-red-500/30 transition-all">
                <LogOut size={12} /> {user?.user_metadata?.full_name?.split(' ')[0] || 'Quitter'}
              </button>
            ) : (
              <button onClick={onAuthOpen} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-gold uppercase tracking-widest border border-gold/30 rounded-sm hover:bg-gold/10 transition-all">
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
            <button onClick={onMobileMenuToggle} className="md:hidden p-2 text-gold">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </nav>
    </>
  );
}