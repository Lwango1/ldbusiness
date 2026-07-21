import { Product } from '../types';
import ProductsSection from '../components/ProductsSection';

interface ProductsPageProps {
  onAddToCart: (product: Product) => void;
  onView3D: (product: Product) => void;
}

export default function ProductsPage({ onAddToCart, onView3D }: ProductsPageProps) {
  return (
    <div className="pt-20">
      <ProductsSection onAddToCart={onAddToCart} onView3D={onView3D} />
    </div>
  );
}
