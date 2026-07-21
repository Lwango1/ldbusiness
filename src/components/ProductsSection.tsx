import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Product } from '../types';
import { getProducts, getAllCategories } from '../services/database';
import ProductCard from './ProductCard';

interface ProductsSectionProps {
  onView3D: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductsSection({ onView3D, onAddToCart }: ProductsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const categories = getAllCategories();

  useEffect(() => {
    getProducts().then(setAllProducts);
  }, []);

  // Filtrage intelligent
  let filteredProducts = allProducts.filter(p => {
    const matchesCategory = selectedCategory === 'Tous' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Logique de tri
  if (sortBy === 'price-asc') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  }

  return (
    <section id="products" className="py-24 px-6 bg-luxury-black min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header de section */}
        <div className="text-center mb-16">
          <span className="text-gold text-[10px] uppercase tracking-[0.5em] font-bold">La Collection</span>
          <h2 className="font-playfair text-4xl md:text-6xl font-bold mt-4 mb-6">
            <span className="gold-shimmer">Prêt-à-Porter & Sur Mesure</span>
          </h2>
          <div className="w-24 h-[1px] bg-gold/30 mx-auto" />
        </div>

        {/* Barre de Recherche & Filtres - Optimisée Mobile */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          {/* Recherche */}
          <div className="relative flex-1 group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gold/40 group-focus-within:text-gold transition-colors" />
            <input
              type="text"
              placeholder="Rechercher une robe, un costume..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-luxury-dark/50 border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold/40 focus:bg-luxury-dark outline-none transition-all"
            />
          </div>

          {/* Tri */}
          <div className="relative min-w-[200px]">
            <SlidersHorizontal size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gold/40 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-14 pr-10 py-4 bg-luxury-dark/50 border border-gold/10 rounded-sm text-white appearance-none cursor-pointer outline-none focus:border-gold/40 transition-all text-sm font-medium"
            >
              <option value="default">Trier par : Récent</option>
              <option value="price-asc">Prix : Croissant</option>
              <option value="price-desc">Prix : Décroissant</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/40 pointer-events-none" />
          </div>
        </div>

        {/* Sélecteur de Catégories (Scroll horizontal sur mobile) */}
        <div className="flex gap-3 mb-16 overflow-x-auto pb-4 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-8 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all border ${
                selectedCategory === cat
                  ? 'bg-gold text-black border-gold shadow-[0_0_20px_rgba(201,169,78,0.2)]'
                  : 'border-white/5 text-gray-500 hover:border-gold/30 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grille de produits avec animation simple */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredProducts.map((product) => (
            <div key={product.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ProductCard
                product={product}
                onView3D={onView3D}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </div>

        {/* État Vide */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-32 border border-dashed border-gold/10 rounded-sm">
            <Search size={48} className="mx-auto text-gold/10 mb-4" />
            <p className="text-gray-500 font-playfair italic text-lg">Aucune création ne correspond à votre sélection.</p>
            <button
              onClick={() => {setSelectedCategory('Tous'); setSearchQuery('');}}
              className="mt-4 text-gold text-xs uppercase tracking-widest font-bold"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </section>
  );
}