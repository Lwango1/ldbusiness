import { useState, useEffect, useCallback } from 'react';
import { Wifi, Plus, Trash2, Save, CheckCircle, Star, KeyRound } from 'lucide-react';
import { useTranslation } from '../i18n';
import {
  getAdminLdConnectPlans,
  adminSaveLdConnectPlan,
  adminDeleteLdConnectPlan,
  getAdminVouchers,
  LdConnectPlanRow,
  WifiVoucher,
} from '../services/ldconnect';

const TIERS = ['bronze', 'argent', 'or'] as const;

function blankPlan(): LdConnectPlanRow {
  return {
    id: `plan_${Date.now().toString(36)}`,
    name: '',
    tier: 'bronze',
    speedMbps: 3,
    durationHours: 24,
    priceCdf: 0,
    features: [],
    mikrotikProfile: 'bronze-3mbps',
    popular: false,
    active: true,
    sort: 0,
  };
}

function formatDur(h: number): string {
  if (h % 720 === 0) return `${h / 720} mois`;
  if (h % 168 === 0) return `${h / 168} jours`;
  if (h % 24 === 0) return `${h / 24} jour(s)`;
  return `${h} h`;
}

export default function AdminLdConnectPlans() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<LdConnectPlanRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, LdConnectPlanRow>>({});
  const [savingId, setSavingId] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [vouchers, setVouchers] = useState<WifiVoucher[]>([]);

  const load = useCallback(async () => {
    const ps = await getAdminLdConnectPlans();
    setPlans(ps);
    setDrafts({});
  }, []);

  const loadVouchers = useCallback(async () => {
    setVouchers(await getAdminVouchers());
  }, []);

  useEffect(() => { load(); loadVouchers(); }, [load, loadVouchers]);

  const row = (id: string): LdConnectPlanRow => drafts[id] || plans.find(p => p.id === id) || blankPlan();

  const set = (id: string, patch: Partial<LdConnectPlanRow>) => {
    setDrafts(prev => ({ ...prev, [id]: { ...row(id), ...patch } }));
  };

  const addNew = () => {
    const p = blankPlan();
    setPlans(prev => [...prev, p]);
    setDrafts(prev => ({ ...prev, [p.id]: p }));
  };

  const save = async (p: LdConnectPlanRow) => {
    setSavingId(p.id);
    setMsg(null);
    const res = await adminSaveLdConnectPlan(p);
    setSavingId('');
    if (res.ok) {
      setMsg({ ok: true, text: t('ldconnectAdmin.saved') });
      load();
      window.setTimeout(() => setMsg(null), 3000);
    } else {
      console.error('save error:', res.error);
      setMsg({ ok: false, text: `${t('ldconnectAdmin.saveError')} — ${res.error}` });
    }
  };

  const remove = async (id: string) => {
    if (!confirm(t('ldconnectAdmin.deleteConfirm'))) return;
    await adminDeleteLdConnectPlan(id);
    load();
  };

  const inputCls = "w-full px-3 py-2 bg-black border border-gold/20 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm";
  const labelCls = "block text-[9px] text-gold/60 uppercase tracking-widest mb-1 font-semibold";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <Wifi size={15} className="text-gold" /> {t('ldconnectAdmin.title')}
          </h2>
          <p className="text-gray-500 text-[11px] mt-1">{t('ldconnectAdmin.subtitle')}</p>
        </div>
        <button onClick={addNew} className="px-4 py-2.5 bg-gold text-black text-[10px] uppercase tracking-widest font-black rounded-sm hover:bg-gold-light transition-all flex items-center gap-1.5">
          <Plus size={14} /> {t('ldconnectAdmin.add')}
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-sm border text-xs flex items-center gap-2 ${msg.ok ? 'bg-green-600/10 border-green-500/30 text-green-400' : 'bg-red-600/10 border-red-500/30 text-red-400'}`}>
          {msg.ok && <CheckCircle size={14} />} {msg.text}
        </div>
      )}

      {plans.length === 0 ? (
        <div className="bg-luxury-dark border border-gold/10 rounded-xl p-10 text-center">
          <Wifi size={40} className="mx-auto text-gold/20 mb-3" />
          <p className="text-gray-500 font-playfair italic">{t('ldconnectAdmin.none')}</p>
        </div>
      ) : (
        plans.map(p => {
          const draft = row(p.id);
          return (
            <div key={p.id} className={`bg-luxury-dark border rounded-xl overflow-hidden transition-all ${draft.active ? 'border-gold/10' : 'border-gray-800 opacity-70'}`}>
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gold/10">
                <div>
                  <label className={labelCls}>{t('ldconnectAdmin.name')}</label>
                  <input value={draft.name} onChange={e => set(p.id, { name: e.target.value })} className={inputCls} placeholder="Bronze 1 jour" />
                </div>
                <div>
                  <label className={labelCls}>{t('ldconnectAdmin.tier')}</label>
                  <select value={draft.tier} onChange={e => set(p.id, { tier: e.target.value as any })} className={inputCls}>
                    {TIERS.map(tr => <option key={tr} value={tr} className="bg-black">{tr}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('ldconnectAdmin.mikrotikProfile')}</label>
                  <input value={draft.mikrotikProfile} onChange={e => set(p.id, { mikrotikProfile: e.target.value })} className={inputCls} placeholder="bronze-3mbps" />
                </div>
              </div>

              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gold/10">
                <div>
                  <label className={labelCls}>{t('ldconnectAdmin.speed')}</label>
                  <input type="number" min={0} step="0.5" value={draft.speedMbps} onChange={e => set(p.id, { speedMbps: Number(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('ldconnectAdmin.duration')}</label>
                  <input type="number" min={0} value={draft.durationHours} onChange={e => set(p.id, { durationHours: Number(e.target.value) || 0 })} className={inputCls} placeholder="24" />
                </div>
                <div>
                  <label className={labelCls}>{t('ldconnectAdmin.priceCdf')}</label>
                  <input
                    type="number" min={0}
                    value={draft.priceCdf || ''}
                    onChange={e => set(p.id, { priceCdf: e.target.value === '' ? 0 : Number(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('ldconnectAdmin.sort')}</label>
                  <input type="number" value={draft.sort} onChange={e => set(p.id, { sort: Number(e.target.value) || 0 })} className={inputCls} />
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gold/10">
                <div className="md:col-span-2">
                  <label className={labelCls}>{t('ldconnectAdmin.features')}</label>
                  <input
                    value={draft.features.join(', ')}
                    onChange={e => set(p.id, { features: e.target.value.split(',').map(f => f.trim()).filter(Boolean) })}
                    className={inputCls}
                    placeholder="3 Mbps, 1 heure de connexion..."
                  />
                </div>
                <div className="flex items-end gap-6 pb-1">
                  <label className="flex items-center gap-2 text-gray-300 text-xs cursor-pointer">
                    <input type="checkbox" checked={draft.popular} onChange={e => set(p.id, { popular: e.target.checked })} className="accent-gold w-4 h-4" />
                    <Star size={13} className="text-gold" /> {t('ldconnectAdmin.popular')}
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 text-xs cursor-pointer">
                    <input type="checkbox" checked={draft.active} onChange={e => set(p.id, { active: e.target.checked })} className="accent-gold w-4 h-4" />
                    {t('ldconnectAdmin.active')}
                  </label>
                </div>
              </div>

              <div className="p-4 flex justify-end gap-2 bg-black/20">
                <button onClick={() => remove(p.id)} className="px-4 py-2.5 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-red-500/10 transition-all flex items-center gap-1.5">
                  <Trash2 size={13} /> {t('ldconnectAdmin.delete')}
                </button>
                <button onClick={() => save(draft)} disabled={savingId === p.id || !draft.name} className="px-5 py-2.5 bg-gold text-black text-[10px] uppercase tracking-widest font-black rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center gap-1.5">
                  {savingId === p.id ? <><span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> ...</> : <><Save size={13} /> {t('ldconnectAdmin.save')}</>}
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* VOUCHERS */}
      <div className="bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gold/10 flex items-center justify-between">
          <h2 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <KeyRound size={15} className="text-gold" /> {t('ldconnectAdmin.vouchersTitle')}
          </h2>
          <span className="text-gold text-[10px]">{vouchers.length} {t('ldconnectAdmin.vouchersCount')}</span>
        </div>
        {vouchers.length === 0 ? (
          <div className="p-10 text-center">
            <KeyRound size={40} className="mx-auto text-gold/20 mb-3" />
            <p className="text-gray-500 font-playfair italic">{t('ldconnectAdmin.vouchersNone')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gold/5">
            {vouchers.map(v => (
              <div key={v.id} className="p-4 flex flex-wrap items-center gap-3">
                <span className={`px-2 py-0.5 text-[9px] rounded-sm uppercase tracking-widest font-bold ${
                  v.status === 'generated' ? 'bg-green-500/20 text-green-400' : v.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {v.status}
                </span>
                <span className="text-white font-mono text-sm font-bold">{v.code || '—'}</span>
                {v.password && <span className="text-gray-400 font-mono text-xs">{t('ldconnectAdmin.pwd')}: {v.password}</span>}
                <span className="text-gray-500 text-xs">{v.planName} · {v.speedMbps} Mbps · {formatDur(v.durationHours)}</span>
                <span className="text-gray-600 text-[10px] font-mono ml-auto">{v.transactionId}</span>
                {v.pushedMikrotik && (
                  <span className="px-2 py-0.5 text-[9px] rounded-sm bg-blue-500/20 text-blue-400 uppercase tracking-widest font-bold">MikroTik</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}