export type LdTier = 'bronze' | 'argent' | 'or';

export interface LdConnectPlan {
  id: string;
  name: string;
  tier: LdTier;
  speedMbps: number;
  durationHours: number;
  priceCdf: number;
  features: string[];
  mikrotikProfile: string;
  popular?: boolean;
}

export const MAXICASH_NUMBER = (import.meta.env.VITE_MAXICASH_NUMBER as string) || '0990000000';
export const MAXICASH_NAME = (import.meta.env.VITE_MAXICASH_NAME as string) || 'LDBusiness';
export const WHATSAPP_NUMBER = ((import.meta.env.VITE_WHATSAPP_NUMBER as string) || '243990000000').replace(/[^0-9]/g, '');

export const TIER_META: Record<LdTier, { label: string; badge: string; dot: string; ring: string }> = {
  bronze: { label: 'Bronze', badge: 'bg-amber-700/20 text-amber-500 border-amber-700/40', dot: 'bg-amber-600', ring: 'hover:border-amber-500/40' },
  argent: { label: 'Argent', badge: 'bg-slate-300/10 text-slate-300 border-slate-300/30', dot: 'bg-slate-300', ring: 'hover:border-slate-300/40' },
  or: { label: 'Or', badge: 'bg-gold/20 text-gold border-gold/40', dot: 'bg-gold', ring: 'hover:border-gold/50' },
};

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

export function formatDuration(hours: number): string {
  if (hours % 720 === 0) return `${hours / 720} mois`;
  if (hours % 168 === 0) return `${hours / 168} jours`;
  if (hours % 24 === 0) return `${hours / 24} jour${hours / 24 > 1 ? 's' : ''}`;
  if (hours === 1) return '1 heure';
  return `${hours} heures`;
}

export const ldConnectPlans: LdConnectPlan[] = [
  { id: 'bronze-1h', name: 'Bronze 1 heure', tier: 'bronze', speedMbps: 3, durationHours: 1, priceCdf: 500, features: ['3 Mbps', '1 heure de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'bronze-3mbps' },
  { id: 'bronze-6h', name: 'Bronze 6 heures', tier: 'bronze', speedMbps: 3, durationHours: 6, priceCdf: 2000, features: ['3 Mbps', '6 heures de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'bronze-3mbps' },
  { id: 'bronze-1d', name: 'Bronze 1 jour', tier: 'bronze', speedMbps: 3, durationHours: 24, priceCdf: 5000, features: ['3 Mbps', '24 heures de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'bronze-3mbps' },
  { id: 'bronze-7d', name: 'Bronze 7 jours', tier: 'bronze', speedMbps: 3, durationHours: 168, priceCdf: 20000, popular: true, features: ['3 Mbps', '7 jours de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'bronze-3mbps' },
  { id: 'bronze-30d', name: 'Bronze 30 jours', tier: 'bronze', speedMbps: 3, durationHours: 720, priceCdf: 60000, features: ['3 Mbps', '30 jours de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'bronze-3mbps' },
  { id: 'argent-1h', name: 'Argent 1 heure', tier: 'argent', speedMbps: 8, durationHours: 1, priceCdf: 1000, features: ['8 Mbps', '1 heure de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'argent-8mbps' },
  { id: 'argent-6h', name: 'Argent 6 heures', tier: 'argent', speedMbps: 8, durationHours: 6, priceCdf: 4000, features: ['8 Mbps', '6 heures de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'argent-8mbps' },
  { id: 'argent-1d', name: 'Argent 1 jour', tier: 'argent', speedMbps: 8, durationHours: 24, priceCdf: 10000, features: ['8 Mbps', '24 heures de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'argent-8mbps' },
  { id: 'argent-7d', name: 'Argent 7 jours', tier: 'argent', speedMbps: 8, durationHours: 168, priceCdf: 35000, popular: true, features: ['8 Mbps', '7 jours de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'argent-8mbps' },
  { id: 'argent-30d', name: 'Argent 30 jours', tier: 'argent', speedMbps: 8, durationHours: 720, priceCdf: 100000, features: ['8 Mbps', '30 jours de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'argent-8mbps' },
  { id: 'or-1h', name: 'Or 1 heure', tier: 'or', speedMbps: 20, durationHours: 1, priceCdf: 2000, features: ['20 Mbps', '1 heure de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'or-20mbps' },
  { id: 'or-6h', name: 'Or 6 heures', tier: 'or', speedMbps: 20, durationHours: 6, priceCdf: 8000, features: ['20 Mbps', '6 heures de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'or-20mbps' },
  { id: 'or-1d', name: 'Or 1 jour', tier: 'or', speedMbps: 20, durationHours: 24, priceCdf: 20000, features: ['20 Mbps', '24 heures de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'or-20mbps' },
  { id: 'or-7d', name: 'Or 7 jours', tier: 'or', speedMbps: 20, durationHours: 168, priceCdf: 60000, popular: true, features: ['20 Mbps', '7 jours de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'or-20mbps' },
  { id: 'or-30d', name: 'Or 30 jours', tier: 'or', speedMbps: 20, durationHours: 720, priceCdf: 150000, features: ['20 Mbps', '30 jours de connexion', 'Valable sur toute la zone'], mikrotikProfile: 'or-20mbps' },
];

export function planPriceCdf(plan: LdConnectPlan): number {
  return plan.priceCdf;
}
