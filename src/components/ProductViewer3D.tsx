import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, ShoppingBag } from 'lucide-react';
import { Product, formatDualPrice } from '../types';

interface ProductViewer3DProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductViewer3D({ product, onClose, onAddToCart }: ProductViewer3DProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [showZoomLens, setShowZoomLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [zoomBgPos, setZoomBgPos] = useState({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  // --- GESTION DU BOUTON RETOUR ANDROID (Indispensable pour l'APK) ---
  useEffect(() => {
    // On ajoute une étape dans l'historique quand le viewer s'ouvre
    window.history.pushState(null, '', window.location.pathname);

    const handlePopState = () => {
      onClose(); // Ferme le viewer si l'utilisateur appuie sur "Retour"
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onClose]);

  // --- LOGIQUE DE ROTATION ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (showZoomLens) return;
    setIsDragging(true);
    setIsAutoRotate(false);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [showZoomLens]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (showZoomLens && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setLensPos({ x: x - 75, y: y - 75 });
      setZoomBgPos({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
      });
      return;
    }

    if (!isDragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setRotateY(prev => prev + dx * 0.5);
    setRotateX(prev => Math.max(-30, Math.min(30, prev - dy * 0.5)));
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, showZoomLens]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // --- LOGIQUE TACTILE (Optimisée Mobile) ---
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (showZoomLens) return;
    setIsDragging(true);
    setIsAutoRotate(false);
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, [showZoomLens]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    setRotateY(prev => prev + dx * 0.5);
    setRotateX(prev => Math.max(-30, Math.min(30, prev - dy * 0.5)));
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, [isDragging]);

  const resetRotation = () => {
    setRotateX(0);
    setRotateY(0);
    setZoom(1);
    setIsAutoRotate(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-luxury-black/98 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 my-auto">

        {/* 3D Viewer Container */}
        <div className="relative group">
          {/* Top Controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
            <button
              onClick={onClose}
              className="p-3 bg-red-500/20 border border-red-500/50 rounded-full text-white hover:bg-red-500 transition-all shadow-lg"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col gap-2 bg-luxury-dark/80 p-2 rounded-2xl border border-gold/20 backdrop-blur-md">
              <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-2 text-gold hover:bg-gold/10 rounded-full">
                <ZoomIn size={22} />
              </button>
              <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 text-gold hover:bg-gold/10 rounded-full">
                <ZoomOut size={22} />
              </button>
              <button onClick={resetRotation} className="p-2 text-gold hover:bg-gold/10 rounded-full">
                <RotateCcw size={22} />
              </button>
              <button
                onClick={() => setShowZoomLens(!showZoomLens)}
                className={`p-2 rounded-full transition-all ${showZoomLens ? 'bg-gold text-black' : 'text-gold'}`}
              >
                <Maximize2 size={22} />
              </button>
              <button
                onClick={() => setIsAutoRotate(!isAutoRotate)}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-xs font-bold transition-all ${isAutoRotate ? 'bg-gold text-black animate-pulse' : 'text-gold border border-gold/30'}`}
              >
                3D
              </button>
            </div>
          </div>

          {/* Interactive Image Container */}
          <div
            ref={imageRef}
            className="relative w-full aspect-[4/5] md:aspect-[3/4] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing bg-gradient-to-b from-luxury-dark to-black border border-gold/20 shadow-2xl"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { handleMouseUp(); if(showZoomLens) setShowZoomLens(false); }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <div
              className={`w-full h-full transition-transform ${isDragging ? '' : 'duration-500'} ${isAutoRotate ? 'animate-slow-rotate' : ''}`}
              style={{
                transform: isAutoRotate ? undefined : `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${zoom})`,
                transformStyle: 'preserve-3d',
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />

              {/* Effets de profondeur 3D */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none" />
              <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] pointer-events-none" />
            </div>

            {/* Loupe de Zoom (Visible sur Desktop ou clic bouton) */}
            {showZoomLens && (
              <div
                className="absolute w-40 h-40 border-2 border-gold rounded-full pointer-events-none shadow-2xl z-30 overflow-hidden"
                style={{
                  left: lensPos.x,
                  top: lensPos.y,
                  backgroundImage: `url(${product.image})`,
                  backgroundSize: '500%',
                  backgroundPosition: `${zoomBgPos.x}% ${zoomBgPos.y}%`,
                }}
              />
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gold/80 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-gold/20 uppercase tracking-[0.2em] whitespace-nowrap">
              {showZoomLens ? 'Déplacez pour zoomer' : 'Faites glisser pour pivoter'}
            </div>
          </div>
        </div>

        {/* Info & Details Section */}
        <div className="flex flex-col justify-center px-2">
          <div className="inline-block px-3 py-1 bg-gold/10 border border-gold/20 rounded-sm w-fit mb-4">
             <span className="text-gold text-xs uppercase tracking-widest">{product.category}</span>
          </div>

          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {product.name}
          </h2>

          <div className="flex items-center gap-4 mb-6">
            <div>
              <div className="text-3xl font-bold text-gold">{formatDualPrice(product.price, product.currency).primary}</div>
              <div className="text-gray-500 text-sm">({formatDualPrice(product.price, product.currency).secondary})</div>
            </div>
            <div className="h-6 w-[1px] bg-gold/20" />
            <span className="text-green-500 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              Disponible immédiatement
            </span>
          </div>

          <p className="text-gray-400 text-lg leading-relaxed mb-8 border-l-2 border-gold/30 pl-4">
            {product.description}
          </p>

          {/* Options de tailles */}
          {product.sizes && (
            <div className="mb-8">
              <span className="text-xs text-gold/50 uppercase tracking-widest block mb-3">Choisir la taille</span>
              <div className="flex gap-3 flex-wrap">
                {product.sizes.map(size => (
                  <button key={size} className="w-12 h-12 border border-gold/20 flex items-center justify-center text-sm text-gray-300 hover:border-gold hover:text-gold transition-all rounded-sm">
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bouton d'action principal */}
          <button
            onClick={() => onAddToCart(product)}
            className="group relative w-full py-5 bg-gold overflow-hidden rounded-sm transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-gold/10"
          >
            <div className="relative z-10 flex items-center justify-center gap-3 text-luxury-black font-bold uppercase tracking-widest">
              <ShoppingBag size={20} />
              Ajouter au panier
            </div>
            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-20" />
          </button>

          <p className="text-[10px] text-center text-gray-500 mt-6 uppercase tracking-widest">
            ✨ Service Prestige LDBusiness • Goma Nord-Kivu
          </p>
        </div>
      </div>
    </div>
  );
}