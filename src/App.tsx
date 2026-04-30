import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { Product, CartItem } from './types';

// Tes composants
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Cart from './components/Cart';
import Invoice from './components/Invoice';
import ProductViewer3D from './components/ProductViewer3D';

// Tes nouvelles pages (on va créer les fichiers juste après)
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
      <div className="min-h-screen bg-luxury-black flex flex-col">
        {/* La Navbar reste visible sur toutes les pages */}
        <Navbar
          cartCount={cartCount}
          onCartClick={() => setIsCartOpen(true)}
        />

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
              path="/produit/:id"
              element={<ProductDetail onAddToCart={handleAddToCart} />}
            />
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
      </div>
    </Router>
  );
}