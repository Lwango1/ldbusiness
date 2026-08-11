import { useState, useEffect, useCallback } from 'react';
import { Wifi, Plus, Trash2, Save, CheckCircle, Star } from 'lucide-react';
import { useTranslation } from '../i18n';
import {
  getAdminKeepGoPlans,
  adminSaveKeepGoPlan,
  adminDeleteKeepGoPlan,
  KeepGoPlanRow,
} from '../services/keepgo';

function blankPlan(): KeepGoPlanRow {
  return {
    id: `plan_${Date.now().toString(36)}`,
    name: '',
    zone: '',
    dataGb: 1,
    validityDays: 7,
    priceUsd: 1,
    priceCdf: null,
    features: [],
    popular: false,
    keepgoUrl: 'https://www.keepgo.com/',
    active: true,
    sort: 0,
  };
}

export default function AdminKeepGoPlans() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<KeepGoPlanRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, KeepGoPlanRow>>({});
  const [savingId, setSavingId] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const ps = await getAdminKeepGoPlans();
    setPlans(ps);
    setDrafts({});
  }, []);

  useEffect(() => { load(); }, [load]);

  const row = (id: string): KeepGoPlanRow => drafts[id] || plans.find(p => p.id === id) || blankPlan();

  const set = (id: string, patch: Partial<KeepGoPlanRow>) => {
    setDrafts(prev => ({ ...prev, [id]: { ...row(id), ...patch } }));
  };

  const addNew = () => {
    const p = blankPlan();
    setPlans(prev => [...prev, p]);
    setDrafts(prev => ({ ...prev, [p.id]: p }));
  };

  const save = async (p: KeepGoPlanRow) => {
    setSavingId(p.id);
    setMsg(null);
    const ok = await adminSaveKeepGoPlan(p, p.active, p.sort);
    setSavingId('');
    if (ok) {
      setMsg({ ok: true, text: t('keepgoAdmin.saved') });
      load();
      window.setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg({ ok: false, text: t('keepgoAdmin.saveError') });
    }
  };

  const remove = async (id: string) => {
    if (!confirm(t('keepgoAdmin.deleteConfirm'))) return;
    await adminDeleteKeepGoPlan(id);
    load();
  };

  const inputCls = "w-full px-3 py-2 bg-black border border-gold/20 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm";
  const labelCls = "block text-[9px] text-gold/60 uppercase tracking-widest mb-1 font-semibold";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <Wifi size={15} className="text-gold" /> {t('keepgoAdmin.title')}
          </h2>
          <p className="text-gray-500 text-[11px] mt-1">{t('keepgoAdmin.subtitle')}</p>
        </div>
        <button onClick={addNew} className="px-4 py-2.5 bg-gold text-black text-[10px] uppercase tracking-widest font-black rounded-sm hover:bg-gold-light transition-all flex items-center gap-1.5">
          <Plus size={14} /> {t('keepgoAdmin.add')}
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
          <p className="text-gray-500 font-playfair italic">{t('keepgoAdmin.none')}</p>
        </div>
      ) : (
        plans.map(p => {
          const draft = row(p.id);
          return (
            <div key={p.id} className={`bg-luxury-dark border rounded-xl overflow-hidden transition-all ${draft.active ? 'border-gold/10' : 'border-gray-800 opacity-70'}`}>
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gold/10">
                <div>
                  <label className={labelCls}>{t('keepgoAdmin.name')}</label>
                  <input value={draft.name} onChange={e => set(p.id, { name: e.target.value })} className={inputCls} placeholder="RD Congo eSIM" />
                </div>
                <div>
                  <label className={labelCls}>{t('keepgoAdmin.zone')}</label>
                  <input value={draft.zone} onChange={e => set(p.id, { zone: e.target.value })} className={inputCls} placeholder="RD Congo" />
                </div>
                <div>
                  <label className={labelCls}>{t('keepgoAdmin.url')}</label>
                  <input value={draft.keepgoUrl} onChange={e => set(p.id, { keepgoUrl: e.target.value })} className={inputCls} placeholder="https://www.keepgo.com/..." />
                </div>
              </div>

              <div className="p-5 grid grid-cols-2 md:grid-cols-5 gap-4 border-b border-gold/10">
                <div>
                  <label className={labelCls}>{t('keepgoAdmin.dataGb')}</label>
                  <input type="number" min={0} value={draft.dataGb} onChange={e => set(p.id, { dataGb: Number(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('keepgoAdmin.validity')}</label>
                  <input type="number" min={0} value={draft.validityDays} onChange={e => set(p.id, { validityDays: Number(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('keepgoAdmin.priceUsd')}</label>
                  <input type="number" min={0} step="0.01" value={draft.priceUsd} onChange={e => set(p.id, { priceUsd: Number(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('keepgoAdmin.priceCdf')}</label>
                  <input
                    type="number" min={0}
                    value={draft.priceCdf ?? ''}
                    placeholder={`≈ ${Math.round(draft.priceUsd * 2850).toLocaleString()} CDF`}
                    onChange={e => set(p.id, { priceCdf: e.target.value === '' ? null : Number(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('keepgoAdmin.sort')}</label>
                  <input type="number" value={draft.sort} onChange={e => set(p.id, { sort: Number(e.target.value) || 0 })} className={inputCls} />
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gold/10">
                <div className="md:col-span-2">
                  <label className={labelCls}>{t('keepgoAdmin.features')}</label>
                  <input
                    value={draft.features.join(', ')}
                    onChange={e => set(p.id, { features: e.target.value.split(',').map(f => f.trim()).filter(Boolean) })}
                    className={inputCls}
                    placeholder="4G LTE, QR code en 2 minutes..."
                  />
                </div>
                <div className="flex items-end gap-6 pb-1">
                  <label className="flex items-center gap-2 text-gray-300 text-xs cursor-pointer">
                    <input type="checkbox" checked={draft.popular} onChange={e => set(p.id, { popular: e.target.checked })} className="accent-gold w-4 h-4" />
                    <Star size={13} className="text-gold" /> {t('keepgoAdmin.popular')}
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 text-xs cursor-pointer">
                    <input type="checkbox" checked={draft.active} onChange={e => set(p.id, { active: e.target.checked })} className="accent-gold w-4 h-4" />
                    {t('keepgoAdmin.active')}
                  </label>
                </div>
              </div>

              <div className="p-4 flex justify-end gap-2 bg-black/20">
                <button onClick={() => remove(p.id)} className="px-4 py-2.5 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-red-500/10 transition-all flex items-center gap-1.5">
                  <Trash2 size={13} /> {t('keepgoAdmin.delete')}
                </button>
                <button onClick={() => save(draft)} disabled={savingId === p.id || !draft.name || !draft.zone} className="px-5 py-2.5 bg-gold text-black text-[10px] uppercase tracking-widest font-black rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center gap-1.5">
                  {savingId === p.id ? <><span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> ...</> : <><Save size={13} /> {t('keepgoAdmin.save')}</>}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}