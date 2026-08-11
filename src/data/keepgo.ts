export interface KeepGoPlan {
  id: string;
  name: string;
  zone: string;
  dataGb: number;
  validityDays: number;
  priceUsd: number;
  priceCdf: number | null;
  features: string[];
  keepgoUrl: string;
  popular?: boolean;
}

export const MAXICASH_NUMBER = (import.meta.env.VITE_MAXICASH_NUMBER as string) || '0990000000';
export const MAXICASH_NAME = (import.meta.env.VITE_MAXICASH_NAME as string) || 'LDBusiness';
export const WHATSAPP_NUMBER = ((import.meta.env.VITE_WHATSAPP_NUMBER as string) || '243990000000').replace(/[^0-9]/g, '');
export const KEEPGO_AFFILIATE_URL = (import.meta.env.VITE_KEEPGO_AFFILIATE_URL as string) || 'https://www.keepgo.com/';

export function formatMaxicashNumber(n: string): string {
  const digits = n.replace(/[^0-9]/g, '');
  if (digits.length === 12) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.length === 9) {
    return `+243 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return n;
}

export function keepgoLink(path: string): string {
  const base = KEEPGO_AFFILIATE_URL;
  if (base.includes('ref=')) {
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}${base.split('?')[1]}`;
  }
  return path;
}

export const keepGoPlans: KeepGoPlan[] = [
  {
    id: 'congo-1gb-7d',
    name: 'RD Congo eSIM',
    zone: 'RD Congo',
    dataGb: 1,
    validityDays: 7,
    priceUsd: 5,
    priceCdf: null,
    features: ['4G LTE', 'QR code en 2 minutes', 'Plafond 1 Go'],
    keepgoUrl: 'https://www.keepgo.com/products/rd-congo-esim-prepaid-data',
  },
  {
    id: 'congo-3gb-7d',
    name: 'RD Congo eSIM',
    zone: 'RD Congo',
    dataGb: 3,
    validityDays: 7,
    priceUsd: 9,
    priceCdf: null,
    features: ['4G LTE', 'QR code en 2 minutes', 'Plafond 3 Go'],
    keepgoUrl: 'https://www.keepgo.com/products/rd-congo-esim-prepaid-data',
    popular: true,
  },
  {
    id: 'africa-1gb-7d',
    name: 'Afrique eSIM',
    zone: 'Afrique (22+ pays)',
    dataGb: 1,
    validityDays: 7,
    priceUsd: 8,
    priceCdf: null,
    features: ['4G LTE', '22+ pays africains', 'Plafond 1 Go'],
    keepgoUrl: 'https://www.keepgo.com/products/lifetime-africa-sim-card',
  },
  {
    id: 'africa-3gb-15d',
    name: 'Afrique eSIM',
    zone: 'Afrique (22+ pays)',
    dataGb: 3,
    validityDays: 15,
    priceUsd: 15,
    priceCdf: null,
    features: ['4G LTE', '22+ pays africains', 'Plafond 3 Go'],
    keepgoUrl: 'https://www.keepgo.com/products/lifetime-africa-sim-card',
    popular: true,
  },
  {
    id: 'world-1gb-7d',
    name: 'World eSIM',
    zone: 'Monde (150+ pays)',
    dataGb: 1,
    validityDays: 7,
    priceUsd: 10,
    priceCdf: null,
    features: ['4G LTE', '150+ pays', 'Voyages et roaming'],
    keepgoUrl: 'https://www.keepgo.com/products/world-esim',
  },
  {
    id: 'world-3gb-15d',
    name: 'World eSIM',
    zone: 'Monde (150+ pays)',
    dataGb: 3,
    validityDays: 15,
    priceUsd: 18,
    priceCdf: null,
    features: ['4G LTE', '150+ pays', 'Voyages et roaming'],
    keepgoUrl: 'https://www.keepgo.com/products/world-esim',
  },
  {
    id: 'world-10gb-30d',
    name: 'World eSIM',
    zone: 'Monde (150+ pays)',
    dataGb: 10,
    validityDays: 30,
    priceUsd: 35,
    priceCdf: null,
    features: ['4G LTE', '150+ pays', 'Plafond 10 Go'],
    keepgoUrl: 'https://www.keepgo.com/products/world-esim',
  },
];

export function planPriceCdf(plan: KeepGoPlan): number {
  if (plan.priceCdf) return plan.priceCdf;
  return Math.round(plan.priceUsd * 2850);
}