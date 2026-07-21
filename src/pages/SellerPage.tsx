import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSeller } from '../services/database';
import { Seller } from '../types';
import SellerRegistration from '../components/SellerRegistration';
import SellerDashboard from '../components/SellerDashboard';

export default function SellerPage() {
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getSeller(user.id).then(s => { setSeller(s); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return null;
  if (!user || !seller || seller.storeName === 'Boutique LDBusiness') {
    return <SellerRegistration onRegistered={async () => { if (user) { const s = await getSeller(user.id); setSeller(s); } }} />;
  }

  return <SellerDashboard seller={seller} />;
}
