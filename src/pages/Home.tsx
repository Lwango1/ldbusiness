import Hero from '../components/Hero';
import AboutSection from '../components/AboutSection';
import ProductsSection from '../components/ProductsSection';
import LiveSection from '../components/LiveSection';
import ContactSection from '../components/ContactSection';
import { Product } from '../types';

interface HomeProps {
  onAddToCart: (product: Product) => void;
  onView3D: (product: Product) => void;
}

export default function Home({ onAddToCart, onView3D }: HomeProps) {
  return (
    <>
      <Hero onNavigate={(section) => {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }} />
      <AboutSection />
      <ProductsSection onAddToCart={onAddToCart} onView3D={onView3D} />
      <LiveSection />
      <ContactSection />
    </>
  );
}