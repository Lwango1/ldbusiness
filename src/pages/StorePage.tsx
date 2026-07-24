import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Store, Package, ArrowLeft, Loader } from 'lucide-react';
import { Seller, Product, formatDualPrice } from '../types';
import { getSeller, getSellerProducts } from '../services/database';

export default function StorePage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    Promise.all([
      getSeller(sellerId),
      getSellerProducts(sellerId),
    ]).then(([sellerData, productsData]) => {
      setSeller(sellerData);
      setProducts(productsData);
      setLoading(false);
    });
  }, [sellerId]);

  if (loading) {
    return (
      <div className="min-h-screen pt-28 px-6 bg-luxury-black flex items-center justify-center">
        <Loader size={32} className="text-gold animate-spin" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen pt-28 px-6 bg-luxury-black flex flex-col items-center justify-center">
        <Store size={48} className="text-gold/30 mb-4" />
        <p className="text-gray-400 font-playfair text-lg">Boutique introuvable</p>
        <button onClick={() => navigate('/')} className="mt-4 text-gold text-xs uppercase tracking-widest">Retour à l'accueil</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-luxury-black">
      <div className="max-w-6xl mx-auto px-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-gold text-xs uppercase tracking-widest mb-8 transition-all">
          <ArrowLeft size={14} /> Retour
        </button>

        {/* En-tête boutique */}
        <div className="bg-luxury-dark border border-gold/10 rounded-xl p-8 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
              <Store size={28} className="text-gold" />
            </div>
            <div>
              <h1 className="font-playfair text-2xl md:text-3xl font-bold text-white">{seller.storeName}</h1>
              {seller.ownerName && (
                <p className="text-gray-500 text-sm">Géré par {seller.ownerName}</p>
              )}
              {seller.description && (
                <p className="text-gray-400 text-sm mt-2 max-w-xl">{seller.description}</p>
              )}
              <p className="text-gray-600 text-xs mt-2">{products.length} produit{products.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Produits */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="text-gold/20 mx-auto mb-3" />
            <p className="text-gray-500 font-playfair italic">Cette boutique n'a pas encore de produits.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => (
              <Link key={product.id} to={`/produit/${product.id}`} className="group bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden hover:border-gold/30 transition-all">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-bold text-sm truncate">{product.name}</h3>
                  <p className="text-gold font-bold mt-1">{formatDualPrice(product.price, product.currency || 'CDF')}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
