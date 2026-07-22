import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ShieldCheck, Truck, Store, ShieldAlert, MessageCircle, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, Seller, formatDualPrice } from '../types';
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
  const [selectedImage, setSelectedImage] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const autoTimerRef = useRef<ReturnType<typeof setInterval>>();

  const images = product?.images?.length ? product.images : (product?.image ? [product.image] : []);

  const nextImage = useCallback(() => {
    if (images.length > 1) {
      setSelectedImage(prev => (prev + 1) % images.length);
    }
  }, [images.length]);

  useEffect(() => {
    if (autoRotate && images.length > 1) {
      autoTimerRef.current = setInterval(nextImage, 3500);
    }
    return () => { if (autoTimerRef.current) clearInterval(autoTimerRef.current); };
  }, [autoRotate, images.length, nextImage]);

  const pauseAutoRotate = () => setAutoRotate(false);
  const resumeAutoRotate = () => setAutoRotate(true);

  const imageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 15;
    const rotateX = ((centerY - y) / centerY) * 15;
    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const scrollCarousel = (dir: number) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

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
        {/* Images du produit avec effet 3D */}
        <div className="space-y-4">
          <div
            ref={imageRef}
            onMouseMove={(e) => { pauseAutoRotate(); handleMouseMove(e); }}
            onMouseEnter={() => { pauseAutoRotate(); setIsHovering(true); }}
            onMouseLeave={() => { resumeAutoRotate(); handleMouseLeave(); }}
            className="relative aspect-[3/4] overflow-hidden rounded-sm bg-luxury-dark border border-gold/10 group"
            style={{
              perspective: '1200px',
            }}
          >
            <div
              className="w-full h-full transition-transform duration-200 ease-out"
              style={{
                transform: isHovering
                  ? `perspective(1200px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.02, 1.02, 1.02)`
                  : 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
              }}
            >
              <img
                key={selectedImage}
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain animate-in fade-in duration-700"
              />
            </div>
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                opacity: isHovering ? 1 : 0,
                background: isHovering
                  ? `radial-gradient(circle at ${50 + tilt.rotateY}% ${50 - tilt.rotateX}%, rgba(212, 175, 55, 0.08) 0%, transparent 60%)`
                  : 'transparent',
              }}
            />
          </div>

          {/* Carrousel 3D des miniatures */}
          {images.length > 1 && (
            <div className="relative">
              {images.length > 4 && (
                <button
                  onClick={() => scrollCarousel(-1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-black/60 border border-gold/20 rounded-full flex items-center justify-center text-gold hover:bg-gold/20 transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
              )}
              <div
                ref={carouselRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 px-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { pauseAutoRotate(); setSelectedImage(i); }}
                    className="group/thumb shrink-0"
                    style={{
                      perspective: '800px',
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded-sm overflow-hidden border-2 transition-all duration-300"
                      style={{
                        borderColor: selectedImage === i ? 'rgb(212, 175, 55)' : 'rgba(212, 175, 55, 0.1)',
                        transform: selectedImage === i
                          ? 'perspective(800px) rotateY(-5deg) scale(1.1)'
                          : 'perspective(800px) rotateY(0deg) scale(1)',
                        opacity: selectedImage === i ? 1 : 0.5,
                      }}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-contain transition-transform duration-300 group-hover/thumb:scale-110"
                      />
                    </div>
                  </button>
                ))}
              </div>
              {images.length > 4 && (
                <button
                  onClick={() => scrollCarousel(1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-black/60 border border-gold/20 rounded-full flex items-center justify-center text-gold hover:bg-gold/20 transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}
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
            <div className="flex items-center gap-3 mt-4">
              {product.discount && product.discount > 0 ? (
                <>
                  <span className="text-gray-500 text-xl line-through">{formatDualPrice(product.price, product.currency).primary}</span>
                  <span className="text-2xl text-gold font-bold">{formatDualPrice(product.price * (1 - product.discount / 100), product.currency).primary}</span>
                  <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-sm">-{product.discount}%</span>
                </>
              ) : (
                <div>
                  <p className="text-2xl text-gold font-bold">{formatDualPrice(product.price, product.currency).primary}</p>
                  <p className="text-gray-500 text-sm">({formatDualPrice(product.price, product.currency).secondary})</p>
                </div>
              )}
            </div>
            {product.stock !== undefined && (
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-xs font-bold uppercase tracking-widest ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
                </span>
              </div>
            )}
            {product.promoCode && product.stock !== 0 && (
              <div className="flex items-center gap-1 mt-2 text-blue-400 text-xs">
                <Tag size={12} /> Code promo: <span className="font-bold">{product.promoCode}</span>
                {product.discount && <span> ({product.discount}% de réduction)</span>}
              </div>
            )}
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

          <div className="flex items-center gap-2 justify-center text-[10px] text-gold/50 uppercase tracking-widest pt-2">
            <ShieldAlert size={12} />
            <span>Achat sécurisé • Transaction via LDBusiness uniquement</span>
          </div>
          <p className="text-[8px] text-red-500/40 text-center uppercase tracking-widest">
            Toute transaction en dehors de la plateforme est interdite et non garantie
          </p>

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
