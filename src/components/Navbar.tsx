import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Phone, Mail } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
}

export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Fermer le menu avec le bouton retour du téléphone
  useEffect(() => {
    if (isMenuOpen) {
      window.history.pushState(null, '', window.location.pathname);
      const handlePopState = () => setIsMenuOpen(false);
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isMenuOpen]);

  const navItems = [
    { label: 'Accueil', section: 'hero', path: '/' },
    { label: 'Produits', section: 'products', path: '/' },
    { label: 'À Propos', section: 'about', path: '/' },
    { label: 'Contact', section: 'contact', path: '/' },
  ];

  const handleNavClick = (path: string, section: string) => {
    setIsMenuOpen(false);
    if (location.pathname === '/' && path === '/') {
      // Si on est déjà sur l'accueil, on scroll
      const el = document.getElementById(section);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Sinon on change de page
      navigate(path);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-luxury-black/95 backdrop-blur-md border-b border-gold/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Levine Mande" className="h-10 md:h-14 object-contain" />
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.section}
                onClick={() => handleNavClick(item.path, item.section)}
                className="text-sm text-gray-300 hover:text-gold uppercase tracking-wider"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
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
        </div>

        {/* MOBILE MENU FULL SCREEN */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-[65px] z-40 bg-luxury-black flex flex-col p-6 animate-in slide-in-from-right">
            <div className="flex flex-col gap-6">
              {navItems.map((item) => (
                <button
                  key={item.section}
                  onClick={() => handleNavClick(item.path, item.section)}
                  className="text-left py-4 text-2xl font-playfair text-gray-200 border-b border-gold/10"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}