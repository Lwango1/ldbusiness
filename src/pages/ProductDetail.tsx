import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ShieldCheck, Truck, Store, ShieldAlert, MessageCircle } from 'lucide-react';
import { Product, Seller } from '../types';
import { getProducts, getSeller } from '../services/database';
import ContactSeller from '../components/ContactSeller';

interface ProductDetailProps {
  onAddToCart: (product: Product) => void;
}

export default function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showContact, setShowContact] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getProducts().then(products => {
        const p = products.find(p => p.id === Number(id)) || null;
        setProduct(p);
        if (p?.sellerId) {
          getSeller(p.sellerId).then(s => setSeller(s));
        }
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white"><p className="text-gray-500">Chargement...</p></div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Produit non trouvé</p>
        <button onClick={() => navigate('/')} className="text-gold ml-4">Retour</button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-6 max-w-7xl mx-auto text-white">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gold/60 hover:text-gold mb-8 transition-colors uppercase text-xs tracking-widest"
      >
        <ArrowLeft size={16} /> Retour à la collection
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image du produit */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-luxury-dark border border-gold/10">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Détails du produit */}
        <div className="space-y-8">
          <div>
            <span className="text-gold text-[10px] uppercase tracking-[0.4em]">Haute Couture</span>
            {seller && (
              <div className="flex items-center gap-2 text-sm text-gold/70 mt-2">
                <Store size={14} /> Vendu par {seller.storeName}
              </div>
            )}
            <h1 className="font-playfair text-4xl md:text-6xl font-bold mt-4">{product.name}</h1>
            <p className="text-2xl text-gold mt-4 font-bold">{product.price.toLocaleString()} CDF</p>
          </div>

          <p className="text-gray-400 leading-relaxed text-lg italic">
            "Une pièce d'exception signée LDBusiness, conçue pour sublimer votre élégance lors de vos événements les plus prestigieux à Goma."
          </p>

          <div className="space-y-4 pt-4 border-t border-gold/10">
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <ShieldCheck className="text-gold" size={20} />
              <span>Qualité Premium & Finition Artisanale</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <Truck className="text-gold" size={20} />
              <span>Livraison disponible partout à Goma</span>
            </div>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            className="w-full py-5 bg-gold text-black font-black uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all flex items-center justify-center gap-3 shadow-2xl shadow-gold/10"
          >
            <ShoppingBag size={20} /> Ajouter au Panier
          </button>

          {/* Sécurisé LDBusiness */}
          <div className="flex items-center gap-2 justify-center text-[10px] text-gold/50 uppercase tracking-widest pt-2">
            <ShieldAlert size={12} />
            <span>Achat sécurisé • Transaction via LDBusiness uniquement</span>
          </div>
          <p className="text-[8px] text-red-500/40 text-center uppercase tracking-widest">
            Toute transaction en dehors de la plateforme est interdite et non garantie
          </p>

          {/* Contacter le vendeur */}
          {seller && (
            <button
              onClick={() => setShowContact(true)}
              className="w-full py-4 border border-gold/30 text-gold text-xs uppercase tracking-widest rounded-sm hover:bg-gold/10 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} /> Contacter {seller.storeName}
            </button>
          )}
        </div>
      </div>

      {showContact && product && (
        <ContactSeller
          product={product}
          onClose={() => setShowContact(false)}
          onSent={() => {}}
        />
      )}
    </div>
  );
}