import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { Product, CartItem } from './types';

// Tes composants
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Cart from './components/Cart';
import Invoice from './components/Invoice';
import ProductViewer3D from './components/ProductViewer3D';
import InstallBanner from './components/InstallBanner';
import AuthModal from './components/AuthModal';
import MobileDrawer from './components/MobileDrawer';
import SubscriptionAlert from './components/SubscriptionAlert';

// Tes pages
import Home from './pages/Home';
import ProductsPage from './pages/ProductsPage';
import AboutPage from './pages/AboutPage';
import LivePage from './pages/LivePage';
import ContactPage from './pages/ContactPage';
import ProductDetail from './pages/ProductDetail';
import SellerPage from './pages/SellerPage';
import AdminPage from './pages/AdminPage';
import OrdersPage from './pages/OrdersPage';
import AdPage from './pages/AdPage';
import SubscriptionPage from './pages/SubscriptionPage';
import StorePage from './pages/StorePage';
import LiveRoom from './components/LiveRoom';

const DRAWER_WIDTH = 280;

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleAddToCart = useCallback((product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  const handleUpdateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== id));
    } else {
      setCartItems(prev =>
        prev.map(item => item.id === id ? { ...item, quantity } : item)
      );
    }
  }, []);

  const handleRemoveItem = useCallback((id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Router>
      <div className="min-h-screen bg-luxury-black overflow-hidden">
        <div
          className="flex flex-col min-h-screen transition-transform duration-300 ease-in-out"
          style={{ transform: isMobileMenuOpen ? `translateX(${DRAWER_WIDTH}px)` : 'translateX(0)' }}
        >
          {/* La Navbar reste visible sur toutes les pages */}
          <Navbar
            cartCount={cartCount}
            onCartClick={() => setIsCartOpen(true)}
            isMobileMenuOpen={isMobileMenuOpen}
            onMobileMenuToggle={() => setIsMobileMenuOpen(prev => !prev)}
            onMobileMenuClose={() => setIsMobileMenuOpen(false)}
            showAuth={showAuth}
            onAuthOpen={() => setShowAuth(true)}
            onAuthClose={() => setShowAuth(false)}
          />

          <SubscriptionAlert />

          {/* Le contenu qui change selon l'URL */}
          <main className="flex-grow">
            <Routes>
              <Route
                path="/"
                element={
                  <Home
                    onView3D={(p) => setSelectedProduct(p)}
                    onAddToCart={handleAddToCart}
                  />
                }
              />
              <Route
                path="/produits"
                element={
                  <ProductsPage
                    onView3D={(p) => setSelectedProduct(p)}
                    onAddToCart={handleAddToCart}
                  />
                }
              />
              <Route path="/a-propos" element={<AboutPage />} />
              <Route path="/live" element={<LivePage />} />
              <Route path="/live/:id" element={<LiveRoom />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route
                path="/produit/:id"
                element={<ProductDetail onAddToCart={handleAddToCart} />}
              />
              <Route path="/vendre" element={<SellerPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/mes-commandes" element={<OrdersPage />} />
              <Route path="/publicite" element={<AdPage />} />
              <Route path="/abonnement" element={<SubscriptionPage />} />
              <Route path="/boutique/:sellerId" element={<StorePage />} />
            </Routes>
          </main>

          <Footer />

          {/* Overlays (Panier et 3D) */}
          {selectedProduct && (
            <ProductViewer3D
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              onAddToCart={(product) => {
                handleAddToCart(product);
                setSelectedProduct(null);
              }}
            />
          )}

          <Cart
            items={cartItems}
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={() => { setIsCartOpen(false); setIsInvoiceOpen(true); }}
          />

          <Invoice
            items={cartItems}
            isOpen={isInvoiceOpen}
            onClose={() => setIsInvoiceOpen(false)}
          />

          <InstallBanner />
        </div>

        {/* Drawer mobile */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <MobileDrawer onClose={() => setIsMobileMenuOpen(false)} onOpenAuth={() => setShowAuth(true)} />
          </div>
        )}

        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
      </div>
    </Router>
  );
}