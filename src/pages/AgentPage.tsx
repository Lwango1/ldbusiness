import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Phone, Users, ShoppingBag, DollarSign, Gift, ArrowLeft, Share2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { getAgentByUserId, getLeadsByAgent, registerAgent, setSessionAgentId } from '../services/leads';
import type { Agent, Lead } from '../services/leads';

export default function AgentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');

  const initAgent = async () => {
    if (!user) return;
    const ag = await getAgentByUserId(user.id);
    if (ag) {
      setAgent(ag);
      setSessionAgentId(ag.id);
      getLeadsByAgent(ag.id).then(setLeads);
    }
  };

  useEffect(() => { initAgent(); }, [user]);

  const handleRegister = async () => {
    if (!user || !form.name || !form.phone) { setError(t('agent.fillFields')); return; }
    setRegistering(true);
    setError('');
    const ag = await registerAgent(user.id, form.name, form.phone);
    if (!ag) { setError(t('agent.registerError')); setRegistering(false); return; }
    setAgent(ag);
    setSessionAgentId(ag.id);
    setRegistering(false);
  };

  const copyLink = () => {
    if (!agent) return;
    const url = `${window.location.origin}/offre?ref=${agent.code}`;
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const commissionRate = agent?.commissionRate || 10;
  const pending = agent ? agent.totalEarned - agent.paidOut : 0;

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/offre')} className="flex items-center gap-2 text-gold text-xs uppercase tracking-widest mb-8 hover:text-gold-light transition-all">
          <ArrowLeft size={16} /> {t('agent.backToOffer')}
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
            <Gift size={28} className="text-gold" />
          </div>
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-2">{t('agent.title')}</h1>
          <p className="text-gray-400 max-w-lg mx-auto">{t('agent.subtitle')}</p>
        </div>

        {!isAuthenticated ? (
          <div className="max-w-md mx-auto text-center bg-luxury-dark border border-gold/10 rounded-xl p-8">
            <p className="text-gray-400 mb-4">{t('agent.needAccount')}</p>
            <button onClick={() => navigate('/vendre')} className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all">
              {t('agent.connect')}
            </button>
          </div>
        ) : !agent ? (
          <div className="max-w-md mx-auto bg-luxury-dark border border-gold/10 rounded-xl p-8">
            <h2 className="text-white font-bold text-lg mb-1">{t('agent.registerTitle')}</h2>
            <p className="text-gray-400 text-sm mb-6">{t('agent.registerDesc')}</p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('agent.name')}</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={t('agent.namePlaceholder')} className="w-full px-5 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('agent.phone')}</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+243..." className="w-full px-5 py-3.5 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button onClick={handleRegister} disabled={registering} className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-40">
                {registering ? '...' : t('agent.becomeAgent')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Code + lien */}
            <div className="bg-luxury-dark border border-gold/10 rounded-xl p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] text-gold/60 uppercase tracking-widest mb-1">{t('agent.yourCode')}</p>
                  <p className="text-3xl md:text-4xl font-mono font-black text-gold tracking-widest">{agent.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input value={`${window.location.origin}/offre?ref=${agent.code}`} readOnly className="flex-1 min-w-0 px-3 py-2.5 bg-black border border-white/10 rounded-sm text-gray-400 text-[10px] outline-none" />
                  <button onClick={copyLink} className="px-4 py-3 bg-gold text-black text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all flex items-center gap-1.5 shrink-0">
                    {copied ? <Share2 size={14} /> : <Copy size={14} />} {copied ? t('agent.copied') : t('agent.copy')}
                  </button>
                </div>
              </div>
              <p className="text-gray-600 text-[10px] mt-3">{t('agent.shareHint')}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
                <Users size={20} className="text-gold mb-2" />
                <div className="text-2xl font-bold text-white">{agent.leadsCount}</div>
                <div className="text-gray-500 text-[10px] uppercase tracking-widest">{t('agent.leads')}</div>
              </div>
              <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
                <ShoppingBag size={20} className="text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">{agent.salesCount}</div>
                <div className="text-gray-500 text-[10px] uppercase tracking-widest">{t('agent.sales')}</div>
              </div>
              <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
                <DollarSign size={20} className="text-yellow-400 mb-2" />
                <div className="text-2xl font-bold text-white">{agent.totalEarned.toLocaleString()} CDF</div>
                <div className="text-gray-500 text-[10px] uppercase tracking-widest">{t('agent.earned')}</div>
              </div>
              <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
                <Phone size={20} className="text-orange-400 mb-2" />
                <div className="text-2xl font-bold text-white">{pending.toLocaleString()} CDF</div>
                <div className="text-gray-500 text-[10px] uppercase tracking-widest">{t('agent.pending')}</div>
              </div>
            </div>

            <div className="bg-gold/5 border border-gold/10 rounded-xl p-5 mb-8">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-300">{t('agent.commissionRate')}</span>
                <span className="text-gold font-bold">{commissionRate}%</span>
              </div>
              <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-gold" style={{ width: '100%' }} />
              </div>
              <p className="text-gray-600 text-[10px] mt-2">{t('agent.payoutNote')}</p>
            </div>

            {/* Leads */}
            <div className="bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-gold/10 flex items-center justify-between">
                <h2 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2"><Users size={14} /> {t('agent.myLeads')}</h2>
                <span className="text-gold text-[10px]">{leads.length}</span>
              </div>
              {leads.length === 0 ? (
                <div className="p-10 text-center">
                  <Users size={40} className="mx-auto text-gold/20 mb-3" />
                  <p className="text-gray-500 font-playfair italic">{t('agent.noLeads')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gold/5">
                  {leads.map(l => (
                    <div key={l.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-bold">{l.name}</p>
                        <p className="text-gray-500 text-[10px]">{l.phone}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] rounded-sm uppercase tracking-widest font-bold ${l.status === 'converted' ? 'bg-green-500/20 text-green-400' : l.status === 'new' ? 'bg-yellow-500/20 text-yellow-400' : l.status === 'contacted' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                        {l.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}