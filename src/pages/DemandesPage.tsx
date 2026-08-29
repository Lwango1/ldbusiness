import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ExternalLink, UserPlus, TrendingUp, Sparkles, Users, AlertCircle, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAgentByUserId, addLead, getSessionAgentId } from '../services/leads';

interface Demande {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
  category: string;
  keyword: string;
}

interface ApiResponse {
  category: string;
  region: string;
  count: number;
  generatedAt: string;
  demandes: Demande[];
}

const CATEGORIES = [
  { id: 'mode', label: 'Mode & Habillement' },
  { id: 'deco', label: 'Décoration & Événements' },
  { id: 'internet', label: 'Internet / WiFi' },
  { id: 'voyage', label: 'Voyage & Hôtels' },
  { id: 'vehicules', label: 'Véhicules & Moto' },
  { id: 'general', label: 'Business & Achats' },
];

const REGIONS = [
  { id: 'world', label: '🌍 Monde entier' },
  { id: 'us', label: 'États-Unis' },
  { id: 'uk', label: 'Royaume-Uni' },
  { id: 'ca', label: 'Canada' },
  { id: 'au', label: 'Australie' },
  { id: 'fr', label: 'France & Europe' },
  { id: 'es', label: 'Espagne' },
  { id: 'br', label: 'Brésil' },
  { id: 'afrique', label: 'Afrique FR' },
  { id: 'na', label: 'Nigéria' },
  { id: 'za', label: 'Afrique du Sud' },
];

export default function DemandesPage() {
  const { isAuthenticated, user } = useAuth();
  const [cat, setCat] = useState('general');
  const [region, setRegion] = useState('world');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agentId, setAgentId] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [leadForm, setLeadForm] = useState({ name: '', phone: '' });
  const [leadTarget, setLeadTarget] = useState<Demande | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const initAgent = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    const sessionId = getSessionAgentId();
    if (sessionId) { setAgentId(sessionId); return; }
    const ag = await getAgentByUserId(user.id);
    if (ag) setAgentId(ag.id);
  }, [isAuthenticated, user]);

  useEffect(() => { initAgent(); }, [initAgent]);

  const fetchDemandes = useCallback(async (category: string, regionId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/demandes?cat=${category}&region=${regionId}`);
      if (!res.ok) throw new Error('status ' + res.status);
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDemandes(cat, region); }, [cat, region, fetchDemandes]);

  const openCapture = (d: Demande) => {
    setLeadTarget(d);
    setLeadForm({ name: '', phone: '' });
    setSavedMsg('');
  };

  const saveLead = async () => {
    if (!leadTarget || !leadForm.name || !leadForm.phone) return;
    if (!agentId) { setSavedMsg('Connecte-toi d\'abord pour gagner tes commissions'); return; }
    setSaving(true);
    const source = `demande:${leadTarget.title.slice(0, 40)}`;
    await addLead(agentId, { name: leadForm.name, phone: leadForm.phone, source });
    setSaving(false);
    setSavedKeys(prev => new Set(prev).add(leadTarget.title));
    setLeadTarget(null);
    setSavedMsg('Prospect ajouté !');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const timeAgo = (iso: string) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'à l\'instant';
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}j`;
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 bg-luxury-black">
      <div className="max-w-5xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase tracking-widest font-bold mb-4">
            <Sparkles size={12} /> Collecteur de demandes
          </div>
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-3">
            Vois ce que les gens recherchent
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto text-sm leading-relaxed">
            Sujets réellement recherchés en ligne, classés par catégorie. Utilise-les pour proposer tes solutions et capturer des prospects.
          </p>
          {!isAuthenticated && (
            <p className="mt-3 text-[10px] text-gold/70 uppercase tracking-widest">
              Connecte-toi via « Vendre » pour gagner des commissions sur les prospects captés.
            </p>
          )}
        </div>

        {/* Sélecteur de catégorie */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`px-4 py-2 rounded-sm text-[11px] uppercase tracking-widest font-bold transition-all border ${
                cat === c.id
                  ? 'bg-gold text-black border-gold'
                  : 'border-gold/20 text-gold hover:bg-gold/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Sélecteur de région */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {REGIONS.map(r => (
            <button
              key={r.id}
              onClick={() => setRegion(r.id)}
              className={`px-3 py-1.5 rounded-sm text-[10px] uppercase tracking-widest font-bold transition-all border ${
                region === r.id
                  ? 'bg-gold/20 text-gold border-gold'
                  : 'border-white/10 text-gray-400 hover:border-gold/30 hover:text-gold'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Ligne d'action */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500 text-[10px] uppercase tracking-widest">
            {data ? `${data.count} resultats — ${data.category} · ${data.region}` : 'En attente de données'}
          </p>
          <button
            onClick={() => fetchDemandes(cat, region)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gold/30 text-gold text-[10px] uppercase tracking-widest rounded-sm hover:bg-gold/10 disabled:opacity-40 transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> {loading ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>

        {/* Erreur */}
        {error && (
          <div className="flex items-center gap-3 bg-red-600/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <div>
              <p className="text-red-300 text-sm font-bold">Impossible de récupérer les demandes</p>
              <p className="text-red-400/80 text-xs">Vérifie que l'API /api/demandes est déployée (Vercel) et réessaie.</p>
            </div>
          </div>
        )}

        {/* Liste des demandes */}
        {loading && !data ? (
          <div className="text-center py-20">
            <Search size={36} className="mx-auto text-gold/30 animate-pulse mb-4" />
            <p className="text-gray-500">Recherche de demandes en cours...</p>
          </div>
        ) : data && data.demandes.length === 0 ? (
          <div className="text-center py-20 bg-luxury-dark border border-gold/10 rounded-xl">
            <Users size={36} className="mx-auto text-gold/20 mb-4" />
            <p className="text-gray-500">Aucune demande trouvée pour cette catégorie. Réessaie plus tard.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.demandes.map((d, i) => {
              const saved = agentId !== null && (savedKeys.has(d.title) || d.title === leadTarget?.title);
              return (
                <div key={i} className="bg-luxury-dark border border-gold/10 rounded-xl p-5 hover:border-gold/40 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-gold text-[9px] uppercase tracking-widest font-bold">{d.category}</span>
                        <span className="text-gray-600 text-[9px]">{d.keyword}</span>
                        <span className="text-gray-600 text-[9px]">{timeAgo(d.pubDate)}</span>
                      </div>
                      <h3 className="text-white font-bold text-base leading-snug mb-1">{d.title}</h3>
                      {d.description && (
                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{d.description}</p>
                      )}
                      {d.source && <p className="text-gray-600 text-[9px] mt-1">Source : {d.source}</p>}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <a
                        href={d.link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center gap-1.5 px-3 py-2 border border-gold/30 text-gold text-[10px] uppercase tracking-widest rounded-sm hover:bg-gold/10 transition-all"
                      >
                        <ExternalLink size={12} /> Lire
                      </a>
                      <button
                        onClick={() => openCapture(d)}
                        disabled={!!agentId && saved}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gold text-black text-[10px] uppercase tracking-widest font-bold rounded-sm hover:bg-gold-light disabled:opacity-40 transition-all"
                      >
                        {saved ? <TrendingUp size={12} /> : <UserPlus size={12} />} {saved ? 'Capté' : 'Capturer'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accès dashboard agent */}
      {isAuthenticated && agentId && (
        <div className="max-w-5xl mx-auto mt-8">
          <a
            href="/agent"
            className="flex items-center justify-center gap-2 w-full py-3 border border-gold/20 text-gold text-[11px] uppercase tracking-widest font-bold rounded-sm hover:bg-gold/10 transition-all"
          >
            <TrendingUp size={14} /> Voir & gérer mes prospects (agents)
          </a>
        </div>
      )}

      {/* Modale de capture */}
      {leadTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-luxury-dark border border-gold/20 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-1">Capturer ce prospect</h2>
            <p className="text-gray-400 text-xs mb-4 line-clamp-2">{leadTarget.title}</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Nom</label>
                <input
                  type="text"
                  value={leadForm.name}
                  onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                  placeholder="Nom du prospect"
                  className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Téléphone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/60" />
                  <input
                    type="tel"
                    value={leadForm.phone}
                    onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                    placeholder="+243..."
                    className="w-full px-4 py-3 pl-9 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm"
                  />
                </div>
              </div>
            </div>
            {savedMsg && !leadTarget && <p className="text-green-400 text-xs mb-3">{savedMsg}</p>}
            {!agentId && (
              <p className="text-red-400 text-[10px] mb-3">Tu dois te connecter comme vendeur/agent pour capturer un prospect.</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={saveLead}
                disabled={saving || !agentId}
                className="flex-1 py-3 bg-gold text-black font-bold text-[11px] uppercase tracking-widest rounded-sm hover:bg-gold-light disabled:opacity-40 transition-all"
              >
                {saving ? '...' : 'Ajouter le prospect'}
              </button>
              <button
                onClick={() => setLeadTarget(null)}
                className="px-4 py-3 border border-white/10 text-gray-300 text-[11px] uppercase tracking-widest rounded-sm hover:bg-white/5 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
