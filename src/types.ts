export interface Seller {
  id: string;
  storeName: string;
  ownerName: string;
  phone: string;
  email?: string;
  description?: string;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  images?: string[];
  category: string;
  sizes?: string[];
  colors?: string[];
  sellerId?: string;
  stock?: number;
  promoCode?: string;
  discount?: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface TransactionItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  sellerId?: string;
  sellerStoreName?: string;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  paymentMethod: string;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  total: number;
  commissionRate: number;
  commissions: { sellerId?: string; sellerStoreName?: string; amount: number }[];
  platformCommission: number;
  status: 'pending' | 'pending_verification' | 'completed' | 'cancelled';
  transactionId?: string;
  screenshotUrl?: string;
}

export const COMMISSION_RATE = 0.10;
export const USD_TO_CDF = 2850;

export function formatDualPrice(price: number | null | undefined, currency: string | null | undefined = 'CDF'): { primary: string; secondary: string } {
  const p = Number(price) || 0;
  const cur = currency || 'CDF';
  if (cur === 'USD') {
    const cdf = Math.round(p * USD_TO_CDF);
    return { primary: `${p.toLocaleString()} USD`, secondary: `${cdf.toLocaleString()} CDF` };
  }
  const usd = (p / USD_TO_CDF).toFixed(2);
  return { primary: `${p.toLocaleString()} CDF`, secondary: `${usd} USD` };
}

export interface LiveStream {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string;
  viewerCount: number;
  isLive: boolean;
  createdAt: string;
  category: string;
  roomName: string;
  hostAvatar?: string;
}

export type SubscriptionPlan = 'monthly' | 'quarterly' | 'biannual';
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  amountUsd: number;
  paymentMethod: string;
  transactionId?: string;
  status: SubscriptionStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export const SUBSCRIPTION_PRICES: Record<SubscriptionPlan, { label: string; price: number; months: number }> = {
  monthly: { label: '1 Mois', price: 3, months: 1 },
  quarterly: { label: '3 Mois', price: 5, months: 3 },
  biannual: { label: '6 Mois', price: 8, months: 6 },
};

export type AdZone = 'hero' | 'between_products' | 'popup' | 'sidebar';
export const AD_ZONE_PRICES: Record<AdZone, { label: string; price: number; desc: string }> = {
  sidebar: { label: 'Bannière latérale', price: 5, desc: '3 diffusions par jour · Côté desktop' },
  popup: { label: 'Pop-up', price: 10, desc: '6 diffusions par jour · Fenêtre contextuelle' },
  hero: { label: 'Bannière Hero', price: 15, desc: 'Chaque heure · Haut de la page d\'accueil' },
  between_products: { label: 'Entre les produits', price: 20, desc: 'Toutes les 30 min · Carrousel entre les articles' },
};
export type AdFrequency = 'daily_3' | 'daily_6' | 'hourly' | 'every_30min';
export type AdStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface Ad {
  id: string;
  brandName: string;
  brandLogo?: string;
  brandWebsite?: string;
  imageUrl: string;
  description?: string;
  zone: AdZone;
  frequency: AdFrequency;
  status: AdStatus;
  startDate?: string;
  endDate?: string;
  impressions: number;
  clicks: number;
  createdAt: string;
}

export interface Message {
  id: string;
  productId: number;
  productName: string;
  sellerId?: string;
  sellerStoreName?: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  content: string;
  date: string;
  read: boolean;
  replied: boolean;
  reply?: string;
  replyDate?: string;
}
