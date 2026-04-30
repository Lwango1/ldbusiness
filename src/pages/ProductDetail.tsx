import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ShieldCheck, Truck } from 'lucide-react';
import { Product } from '../types';
import { products } from '../data/products'; // Assure-toi d'avoir un fichier data

interface ProductDetailProps {
  onAddToCart: (product: Product) => void;
}

export default function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Recherche du produit par ID
  const product = products.find(p => p.id === Number(id));

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
            <h1 className="font-playfair text-4xl md:text-6xl font-bold mt-4">{product.name}</h1>
            <p className="text-2xl text-gold mt-4 font-bold">{product.price.toLocaleString()} CDF</p>
          </div>

          <p className="text-gray-400 leading-relaxed text-lg italic">
            "Une pièce d'exception signée Levine Mande, conçue pour sublimer votre élégance lors de vos événements les plus prestigieux à Kinshasa."
          </p>

          <div className="space-y-4 pt-4 border-t border-gold/10">
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <ShieldCheck className="text-gold" size={20} />
              <span>Qualité Premium & Finition Artisanale</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <Truck className="text-gold" size={20} />
              <span>Livraison disponible partout à Kinshasa</span>
            </div>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            className="w-full py-5 bg-gold text-black font-black uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all flex items-center justify-center gap-3 shadow-2xl shadow-gold/10"
          >
            <ShoppingBag size={20} /> Ajouter au Panier
          </button>
        </div>
      </div>
    </div>
  );
}