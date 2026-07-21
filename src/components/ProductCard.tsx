import { useState, useEffect } from 'react';
import { Eye, ShoppingBag, Store } from 'lucide-react';
import { Product, Seller } from '../types';
import { getSeller } from '../services/database';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onView3D: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onView3D, onAddToCart }: ProductCardProps) {
  const [seller, setSeller] = useState<Seller | null>(null);

  useEffect(() => {
    if (product.sellerId) {
      getSeller(product.sellerId).then(setSeller);
    }
  }, [product.sellerId]);
  return (
    <div className="product-3d-container group">
      <div className="product-3d-card bg-luxury-dark border border-gold/10 rounded-lg overflow-hidden hover:border-gold/30 transition-all duration-500">

        {/* L'image devient un lien vers la page produit */}
        <Link to={`/produit/${product.id}`} className="block relative aspect-[3/4] overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Category badge */}
          <div className="absolute top-3 left-3 px-3 py-1 bg-luxury-black/70 text-gold text-xs rounded-full border border-gold/20">
            {product.category}
          </div>
        </Link>

        {/* Quick actions (restent des boutons pour ne pas interférer avec le lien) */}
        <div className="absolute bottom-[110px] left-4 right-4 flex gap-2 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-10">
          <button
            onClick={() => onView3D(product)}
            className="flex-1 py-3 bg-gold/90 text-luxury-black font-semibold text-xs rounded-sm flex items-center justify-center gap-2 hover:bg-gold transition-colors uppercase tracking-wider"
          >
            <Eye size={14} /> Vue 3D
          </button>
          <button
            onClick={(e) => {
              e.preventDefault(); // Empêche de naviguer si on clique juste sur le panier
              onAddToCart(product);
            }}
            className="p-3 bg-luxury-black/80 text-gold border border-gold/50 rounded-sm hover:bg-gold hover:text-luxury-black transition-colors"
          >
            <ShoppingBag size={14} />
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          <Link to={`/produit/${product.id}`}>
            <h3 className="font-playfair text-lg font-semibold text-white mb-1 truncate hover:text-gold transition-colors">
              {product.name}
            </h3>
          </Link>
          {seller && (
            <div className="flex items-center gap-1 text-[11px] text-gold/60 mb-1">
              <Store size={10} /> {seller.storeName}
              <span className="text-[8px] text-red-500/30 ml-auto">🔒 Plateforme</span>
            </div>
          )}
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-gold font-bold text-lg">{product.price.toLocaleString()} CDF</span>
            <span className="text-green-500 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> En stock
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}