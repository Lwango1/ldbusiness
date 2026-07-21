import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import Hero from '../components/Hero';
import ProductsSection from '../components/ProductsSection';
import LiveSection from '../components/LiveSection';
import AdBanner from '../components/AdBanner';

interface HomeProps {
  onView3D: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function Home({ onView3D, onAddToCart }: HomeProps) {
  const navigate = useNavigate();

  return (
    <>
      <Hero onNavigate={(path) => navigate(path)} />
      <div className="max-w-7xl mx-auto px-6 mt-10">
        <AdBanner zone="hero" />
      </div>
      <ProductsSection onView3D={onView3D} onAddToCart={onAddToCart} />
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <AdBanner zone="between_products" />
      </div>
      <LiveSection />
      <AdBanner zone="popup" />
    </>
  );
}