import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { DollarSign, TrendingUp, ShoppingCart, CheckCircle, Clock, Lock, Users, XCircle, Image as ImageIcon, Hash, Megaphone, ThumbsUp, ThumbsDown, Trash2, ExternalLink, Crown, Search, Gift, PhoneCall, Wifi } from 'lucide-react';
import { Transaction, Ad, Subscription, SubscriptionPlan } from '../types';
import { getTransactions, completeTransaction, cancelTransaction, getTotalCommissions, getPendingCommissions, getAllAdRequests, approveAd, rejectAd, deleteAd, getAllSubscriptionRequests, approveSubscription, rejectSubscription, deleteSubscription } from '../services/database';
import { getAllAgents, getLeadsByAgentIds, payoutAgent } from '../services/leads';
import type { Agent, Lead } from '../services/leads';
import AdminGuard, { clearAdminAuth } from '../components/AdminGuard';
import AdminLdConnectPlans from '../components/AdminLdConnectPlans';
import { approveVoucher } from '../services/ldconnect';

function AdminDashboard() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [pendingCommissions, setPendingCommissions] = useState(0);
  const [tab, setTab] = useState<'transactions' | 'ads' | 'subscriptions' | 'agents' | 'ldconnect'>('transactions');
  const [ads, setAds] = useState<Ad[]>([]);
  const [subscriptions, setSubscriptions] = useState<(Subscription & { user?: { name: string; phone: string } })[]>([]);
  const [txIdInput, setTxIdInput] = useState<Record<string, string>>({});
  const [showLock, setShowLock] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leadsByAgent, setLeadsByAgent] = useState<Record<string, Lead[]>>({});
  const [payAmount, setPayAmount] = useState<Record<string, string>>({});

  const loadAgents = async () => {
    const ag = await getAllAgents();
    setAgents(ag);
    if (ag.length > 0) {
      const ls = await getLeadsByAgentIds(ag.map(a => a.id));
      const grouped: Record<string, Lead[]> = {};
      ls.forEach(l => { (grouped[l.agentId] = grouped[l.agentId] || []).push(l); });
      setLeadsByAgent(grouped);
    }
  };

  const refresh = () => {
    Promise.all([getTransactions(), getTotalCommissions(), getPendingCommissions()]).then(([txns, total, pending]) => {
      setTransactions(txns);
      setTotalCommissions(total);
      setPendingCommissions(pending);
    });
  };

  const handleComplete = async (txn: Transaction) => {
    await completeTransaction(txn.id);
    if (txn.invoiceNumber.startsWith('LDC-')) {
      await approveVoucher(txn.invoiceNumber);
    }
    refresh();
  };

  useEffect(() => {
    refresh();
  }, []);

  const completedTxns = transactions.filter(t => t.status === 'completed').length;
  const pendingTxns = transactions.filter(t => t.status === 'pending').length;
  const verificationTxns = transactions.filter(t => t.status === 'pending_verification').length;

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-2">
              {t('admin.title')}
            </h1>
            <p className="text-gray-500 text-sm">{t('admin.subtitle')}</p>
          </div>
          <button
            onClick={() => { if (confirm(t('admin.lockConfirm'))) { clearAdminAuth(); window.location.reload(); } }}
            className="px-4 py-2 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-red-500/10 transition-all flex items-center gap-1.5"
          >
            <Lock size={12} /> {t('admin.lock')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
            <DollarSign size={20} className="text-gold mb-2" />
            <div className="text-2xl font-bold text-white">{totalCommissions.toLocaleString()} CDF</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">{t('admin.statsCommission')}</div>
          </div>
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
            <TrendingUp size={20} className="text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-yellow-400">{pendingCommissions.toLocaleString()} CDF</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">{t('admin.statsPending')}</div>
          </div>
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
            <ShoppingCart size={20} className="text-green-500 mb-2" />
            <div className="text-2xl font-bold text-green-400">{completedTxns}</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">{t('admin.statsCompleted')}</div>
          </div>
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
            <Clock size={20} className="text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-blue-400">{pendingTxns}</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">{t('admin.statsInProgress')}</div>
          </div>
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
            <CheckCircle size={20} className="text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-orange-400">{verificationTxns}</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">{t('admin.statsVerification')}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-luxury-dark/50 border border-gold/10 rounded-lg p-1 w-fit flex-wrap">
          <button onClick={() => setTab('transactions')} className={`px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-md transition-all ${tab === 'transactions' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'}`}>
            {t('admin.tabTransactions')}
          </button>
          <button onClick={() => { setTab('ads'); getAllAdRequests().then(setAds); }} className={`px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-md transition-all ${tab === 'ads' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'}`}>
            <Megaphone size={14} className="inline mr-2" /> {t('admin.tabAds')}
          </button>
          <button onClick={() => { setTab('subscriptions'); getAllSubscriptionRequests().then(setSubscriptions); }} className={`px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-md transition-all ${tab === 'subscriptions' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'}`}>
            <Crown size={14} className="inline mr-2" /> {t('admin.tabSubscriptions')}
          </button>
          <button onClick={() => { setTab('agents'); loadAgents(); }} className={`px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-md transition-all ${tab === 'agents' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'}`}>
            <Gift size={14} className="inline mr-2" /> {t('admin.tabAgents')}
          </button>
          <button onClick={() => { setTab('ldconnect'); }} className={`px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-md transition-all ${tab === 'ldconnect' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'}`}>
            <Wifi size={14} className="inline mr-2" /> {t('admin.tabLdConnect')}
          </button>
        </div>

        {tab === 'ads' ? (
          <div className="bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-gold/10 flex items-center justify-between">
              <h2 className="text-white font-bold text-sm uppercase tracking-widest">{t('admin.adsTitle')}</h2>
              <span className="text-gold text-[10px]">{ads.filter(a => a.status === 'pending').length} {t('admin.adsPending')}</span>
            </div>
            {ads.length === 0 ? (
              <div className="p-10 text-center">
                <Megaphone size={40} className="mx-auto text-gold/20 mb-3" />
                <p className="text-gray-500 font-playfair italic">{t('admin.adsNone')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gold/5">
                {ads.map(ad => (
                  <div key={ad.id} className="p-5">
                    <div className="flex items-start gap-4">
                      <img src={ad.imageUrl} alt={ad.brandName} className="w-20 h-14 object-cover rounded border border-gold/10" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-bold text-sm">{ad.brandName}</h3>
                          <span className={`px-2 py-0.5 text-[9px] rounded-sm uppercase tracking-widest font-bold ${ad.status === 'approved' ? 'bg-green-500/20 text-green-400' : ad.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {ad.status === 'approved' ? t('admin.adStatusApproved') : ad.status === 'pending' ? t('admin.adStatusPending') : t('admin.adStatusRejected')}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                          <span>Zone: {ad.zone}</span>
                          <span>•</span>
                          <span>Fréquence: {ad.frequency}</span>
                          <span>•</span>
                          <span>Impressions: {ad.impressions}</span>
                          {ad.brandWebsite && (
                            <><span>•</span><a href={ad.brandWebsite} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Site <ExternalLink size={10} className="inline" /></a></>
                          )}
                        </div>
                        {ad.description && <p className="text-gray-400 text-xs mt-1">{ad.description}</p>}
                        {ad.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <button onClick={async () => { await approveAd(ad.id); getAllAdRequests().then(setAds); }} className="px-4 py-1.5 bg-green-600/20 border border-green-500/30 text-green-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-green-600/30 flex items-center gap-1">
                              <ThumbsUp size={12} /> {t('admin.adApprove')}
                            </button>
                            <button onClick={async () => { await rejectAd(ad.id); getAllAdRequests().then(setAds); }} className="px-4 py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-red-600/30 flex items-center gap-1">
                              <ThumbsDown size={12} /> {t('admin.adReject')}
                            </button>
                            <button onClick={async () => { if (confirm(t('admin.deleteAdConfirm'))) { await deleteAd(ad.id); getAllAdRequests().then(setAds); } }} className="px-3 py-1.5 border border-gray-500/30 text-gray-400 text-[10px] rounded-sm hover:bg-gray-500/10">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : tab === 'subscriptions' ? (
          <div className="bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-gold/10 flex items-center justify-between">
              <h2 className="text-white font-bold text-sm uppercase tracking-widest">{t('admin.subsTitle')}</h2>
              <span className="text-gold text-[10px]">{subscriptions.filter(s => s.status === 'pending').length} {t('admin.adsPending')}</span>
            </div>
            {subscriptions.length === 0 ? (
              <div className="p-10 text-center">
                <Crown size={40} className="mx-auto text-gold/20 mb-3" />
                <p className="text-gray-500 font-playfair italic">{t('admin.subsNone')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gold/5">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                        <Crown size={20} className="text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-bold text-sm">{(sub as any).user?.name || t('admin.subsUser')}</h3>
                          <span className={`px-2 py-0.5 text-[9px] rounded-sm uppercase tracking-widest font-bold ${sub.status === 'active' ? 'bg-green-500/20 text-green-400' : sub.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {sub.status === 'active' ? t('admin.subsActive') : sub.status === 'pending' ? t('admin.subsPending') : t('admin.subsExpired')}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                          <span>{sub.amountUsd}$</span>
                          <span>•</span>
                          <span>{(sub as any).user?.phone || t('admin.phoneNotSet')}</span>
                          <span>•</span>
                          <span>{t('admin.requestedOn')} {new Date(sub.createdAt).toLocaleDateString('fr-FR')}</span>
                          {sub.transactionId && (
                            <>
                              <span>•</span>
                              <span className="text-gold font-mono font-bold">{sub.transactionId}</span>
                            </>
                          )}
                        </div>
                        {sub.status === 'pending' && (
                          <div className="flex gap-2 mt-3 items-center flex-wrap">
                            <input
                              type="text"
                              value={txIdInput[sub.id] || ''}
                              onChange={e => setTxIdInput({...txIdInput, [sub.id]: e.target.value})}
                              placeholder={t('admin.transactionId')}
                              className="px-3 py-1.5 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 text-[10px] outline-none focus:border-gold w-40"
                            />
                            <button onClick={async () => {
                              try {
                                const txId = txIdInput[sub.id] || sub.transactionId;
                                if (!txId) { alert(t('admin.enterTxId')); return; }
                                const ok = await approveSubscription(sub.id, txId);
                                if (!ok) { alert(t('admin.validateError')); return; }
                                getAllSubscriptionRequests().then(setSubscriptions);
                              } catch (e: any) { alert(t('admin.error') + e.message); }
                            }} className="px-4 py-1.5 bg-green-600/20 border border-green-500/30 text-green-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-green-600/30 flex items-center gap-1">
                              <ThumbsUp size={12} /> {t('admin.validate')}
                            </button>
                            <button onClick={async () => {
                              try {
                                const ok = await rejectSubscription(sub.id);
                                if (!ok) { alert(t('admin.rejectError')); return; }
                                getAllSubscriptionRequests().then(setSubscriptions);
                              } catch (e: any) { alert(t('admin.error') + e.message); }
                            }} className="px-3 py-1.5 border border-red-500/30 text-red-400 text-[10px] rounded-sm hover:bg-red-500/10">
                              <ThumbsDown size={12} /> {t('admin.reject')}
                            </button>
                          </div>
                        )}
                        {sub.status !== 'pending' && (
                          <button onClick={async () => {
                            if (!confirm(t('admin.deleteConfirm'))) return;
                            try {
                              const ok = await deleteSubscription(sub.id);
                              if (!ok) { alert('Erreur lors de la suppression'); return; }
                              getAllSubscriptionRequests().then(setSubscriptions);
                            } catch (e: any) { alert('Erreur: ' + e.message); }
                          }} className="mt-2 text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1">
                            <Trash2 size={10} /> {t('admin.delete')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : tab === 'agents' ? (
          <div className="space-y-6">
            <div className="bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-gold/10 flex items-center justify-between">
                <h2 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2"><Gift size={14} /> {t('admin.agentsTitle')}</h2>
                <span className="text-gold text-[10px]">{agents.length} {t('admin.agentsCount')}</span>
              </div>
              {agents.length === 0 ? (
                <div className="p-10 text-center">
                  <Gift size={40} className="mx-auto text-gold/20 mb-3" />
                  <p className="text-gray-500 font-playfair italic">{t('admin.agentsNone')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gold/5">
                  {agents.map(a => {
                    const pending = a.totalEarned - a.paidOut;
                    const aLeads = leadsByAgent[a.id] || [];
                    return (
                      <div key={a.id} className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                            <Gift size={20} className="text-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-bold text-sm">{a.name}</h3>
                              <span className="px-2 py-0.5 text-[9px] bg-gold/20 text-gold rounded-sm uppercase tracking-widest font-bold font-mono">{a.code}</span>
                              <span className={`px-2 py-0.5 text-[9px] rounded-sm uppercase tracking-widest font-bold ${a.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{a.status}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                              <span><PhoneCall size={10} className="inline mr-0.5" />{a.phone}</span>
                              <span>•</span>
                              <span>{a.commissionRate}%</span>
                              <span>•</span>
                              <span>{t('admin.addedOn')} {new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                              <div className="bg-black/40 rounded-sm p-2">
                                <span className="text-gray-600 block text-[9px] uppercase tracking-widest">{t('agent.leads')}</span>
                                <span className="text-white font-bold">{a.leadsCount}</span>
                              </div>
                              <div className="bg-black/40 rounded-sm p-2">
                                <span className="text-gray-600 block text-[9px] uppercase tracking-widest">{t('agent.sales')}</span>
                                <span className="text-white font-bold">{a.salesCount}</span>
                              </div>
                              <div className="bg-black/40 rounded-sm p-2">
                                <span className="text-gray-600 block text-[9px] uppercase tracking-widest">{t('agent.earned')}</span>
                                <span className="text-yellow-400 font-bold">{a.totalEarned.toLocaleString()}</span>
                              </div>
                            </div>
                            {pending > 0 && (
                              <div className="mt-3 p-3 bg-gold/5 border border-gold/20 rounded-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                  <span className="text-[10px] text-gold uppercase tracking-widest font-bold">{t('admin.pendingPayout')}: <span className="text-yellow-400">{pending.toLocaleString()} CDF</span></span>
                                  <div className="flex gap-2 flex-1">
                                    <input type="number" value={payAmount[a.id] || ''} onChange={e => setPayAmount({...payAmount, [a.id]: e.target.value})} placeholder={t('admin.amount')} className="flex-1 px-3 py-2 bg-black border border-gold/10 rounded-sm text-white text-xs outline-none focus:border-gold" />
                                    <button onClick={async () => {
                                      const amt = Number(payAmount[a.id]);
                                      if (!amt || amt > pending) { alert(t('admin.invalidAmount')); return; }
                                      const ok = await payoutAgent(a.id, amt);
                                      if (!ok) { alert(t('admin.payoutError')); return; }
                                      loadAgents();
                                    }} className="px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-green-600/30 flex items-center gap-1">
                                      <CheckCircle size={12} /> {t('admin.payAgent')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {aLeads.length > 0 && (
                              <div className="mt-3">
                                <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-1">{t('admin.agentLeads')}</p>
                                <div className="flex flex-wrap gap-2">
                                  {aLeads.slice(0, 8).map(l => (
                                    <span key={l.id} className="px-2 py-1 bg-black/40 border border-white/5 rounded-sm text-[10px] text-gray-300">
                                      {l.name} <span className="text-gray-600">({l.phone})</span>
                                    </span>
                                  ))}
                                  {aLeads.length > 8 && <span className="px-2 py-1 text-[10px] text-gray-500">+{aLeads.length - 8}</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : tab === 'ldconnect' ? (
          <AdminLdConnectPlans />
        ) : (
        /* Transactions List */
        <div className="bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gold/10">
            <h2 className="text-white font-bold text-sm uppercase tracking-widest">{t('admin.transactionsTitle')}</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-10 text-center">
              <ShoppingCart size={40} className="mx-auto text-gold/20 mb-3" />
              <p className="text-gray-500 font-playfair italic">{t('admin.transactionsNone')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gold/5">
              {transactions.map(txn => (
                <div key={txn.id} className="p-5 hover:bg-white/[0.02] transition-all">
                    <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${txn.status === 'completed' ? 'bg-green-500' : txn.status === 'pending_verification' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                      <span className="text-white font-mono text-sm font-bold">{txn.invoiceNumber}</span>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${txn.status === 'completed' ? 'text-green-500' : txn.status === 'pending_verification' ? 'text-orange-400' : 'text-yellow-500'}`}>
                      {txn.status === 'completed' ? t('admin.transactionCompleted') : txn.status === 'pending_verification' ? t('admin.transactionPending') : t('admin.transactionWaiting')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600 block">{t('admin.client')}</span>
                      <span className="text-white">{txn.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">{t('admin.total')}</span>
                      <span className="text-gold font-bold">{txn.total.toLocaleString()} CDF</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">{t('admin.commission')}</span>
                      <span className="text-green-400 font-bold">{txn.platformCommission.toLocaleString()} CDF</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">{t('admin.date')}</span>
                      <span className="text-gray-400">{new Date(txn.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  {/* Vendeurs dans cette transaction */}
                  {txn.commissions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {txn.commissions.map((c, i) => (
                        <span key={i} className="px-2 py-1 bg-gold/5 border border-gold/10 rounded-sm text-[10px] text-gold/70">
                          <Users size={10} className="inline mr-1" />
                          {c.sellerStoreName}: <strong className="text-white">{c.amount.toLocaleString()} CDF</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {txn.status === 'pending_verification' && (
                      <>
                        <button
                          onClick={() => handleComplete(txn)}
                          className="px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-green-600/30 transition-all"
                        >
                          <CheckCircle size={12} className="inline mr-1" /> {t('admin.paymentReceived')}
                        </button>
                        <button
                          onClick={async () => { await cancelTransaction(txn.id); refresh(); }}
                          className="px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-red-600/30 transition-all"
                        >
                          <XCircle size={12} className="inline mr-1" /> {t('admin.paymentInvalid')}
                        </button>
                      </>
                    )}
                    {txn.status === 'pending' && (
                      <button
                        onClick={() => handleComplete(txn)}
                        className="px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-green-600/30 transition-all"
                      >
                        <CheckCircle size={12} className="inline mr-1" /> {t('admin.markCompleted')}
                      </button>
                    )}
                    <button onClick={() => setSelectedTxn(selectedTxn?.id === txn.id ? null : txn)} className="px-4 py-2 text-gold text-[10px] uppercase tracking-widest hover:underline">
                      {t('admin.details')}
                    </button>
                  </div>

                  {selectedTxn?.id === txn.id && (
                    <div className="mt-4 space-y-3">
                      {(txn.transactionId || txn.screenshotUrl) && (
                        <div className="p-4 bg-black/40 border border-gold/10 rounded-lg">
                          <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-3">{t('admin.proofOfPayment')}</h4>
                          {txn.transactionId && (
                            <div className="flex items-center gap-2 text-xs mb-2">
                              <Hash size={14} className="text-gold/60" />
                              <span className="text-gray-400">{t('admin.transactionIdLabel')}</span>
                              <span className="text-white font-mono font-bold">{txn.transactionId}</span>
                            </div>
                          )}
                          {txn.screenshotUrl && (
                            <div className="mt-2">
                              <a href={txn.screenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-gold/10 border border-gold/20 rounded-sm text-gold text-[10px] hover:bg-gold/20 transition-all">
                                <ImageIcon size={14} /> {t('admin.viewScreenshot')}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-4 bg-black/40 border border-gold/10 rounded-lg">
                        <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-3">{t('admin.itemsSold')}</h4>
                        {txn.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs py-2 border-b border-gold/5 last:border-0">
                            <div>
                              <span className="text-white">{item.productName || `Article #${i + 1}`}</span>
                              <span className="text-gray-600 ml-2">x{item.quantity}</span>
                            </div>
                            <span className="text-white font-bold">{(item.price * item.quantity).toLocaleString()} CDF</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}
