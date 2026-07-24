import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ShoppingCart, CheckCircle, Clock, Lock, Users, XCircle, Image as ImageIcon, Hash, Megaphone, ThumbsUp, ThumbsDown, Trash2, ExternalLink, Crown, Search } from 'lucide-react';
import { Transaction, Ad, Subscription, SubscriptionPlan } from '../types';
import { getTransactions, completeTransaction, cancelTransaction, getTotalCommissions, getPendingCommissions, getAllAdRequests, approveAd, rejectAd, deleteAd, getAllSubscriptionRequests, approveSubscription, rejectSubscription, deleteSubscription } from '../services/database';
import AdminGuard, { clearAdminAuth } from '../components/AdminGuard';

function AdminDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [pendingCommissions, setPendingCommissions] = useState(0);
  const [tab, setTab] = useState<'transactions' | 'ads' | 'subscriptions'>('transactions');
  const [ads, setAds] = useState<Ad[]>([]);
  const [subscriptions, setSubscriptions] = useState<(Subscription & { user?: { name: string; phone: string } })[]>([]);
  const [txIdInput, setTxIdInput] = useState<Record<string, string>>({});
  const [showLock, setShowLock] = useState(false);

  useEffect(() => {
    Promise.all([getTransactions(), getTotalCommissions(), getPendingCommissions()]).then(([txns, total, pending]) => {
      setTransactions(txns);
      setTotalCommissions(total);
      setPendingCommissions(pending);
    });
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
              Administration
            </h1>
            <p className="text-gray-500 text-sm">Gestion des ventes et commissions</p>
          </div>
          <button
            onClick={() => { if (confirm('Verrouiller l\'accès admin ?')) { clearAdminAuth(); window.location.reload(); } }}
            className="px-4 py-2 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-red-500/10 transition-all flex items-center gap-1.5"
          >
            <Lock size={12} /> Verrouiller
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
            <DollarSign size={20} className="text-gold mb-2" />
            <div className="text-2xl font-bold text-white">{totalCommissions.toLocaleString()} CDF</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">Commission Totale</div>
          </div>
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
            <TrendingUp size={20} className="text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-yellow-400">{pendingCommissions.toLocaleString()} CDF</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">En Attente</div>
          </div>
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
            <ShoppingCart size={20} className="text-green-500 mb-2" />
            <div className="text-2xl font-bold text-green-400">{completedTxns}</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">Ventes Complétées</div>
          </div>
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
            <Clock size={20} className="text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-blue-400">{pendingTxns}</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">En Cours</div>
          </div>
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
            <CheckCircle size={20} className="text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-orange-400">{verificationTxns}</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">Vérification</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-luxury-dark/50 border border-gold/10 rounded-lg p-1 w-fit flex-wrap">
          <button onClick={() => setTab('transactions')} className={`px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-md transition-all ${tab === 'transactions' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'}`}>
            Transactions
          </button>
          <button onClick={() => { setTab('ads'); getAllAdRequests().then(setAds); }} className={`px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-md transition-all ${tab === 'ads' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'}`}>
            <Megaphone size={14} className="inline mr-2" /> Publicité
          </button>
          <button onClick={() => { setTab('subscriptions'); getAllSubscriptionRequests().then(setSubscriptions); }} className={`px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-md transition-all ${tab === 'subscriptions' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'}`}>
            <Crown size={14} className="inline mr-2" /> Abonnements
          </button>
        </div>

        {tab === 'ads' ? (
          <div className="bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-gold/10 flex items-center justify-between">
              <h2 className="text-white font-bold text-sm uppercase tracking-widest">Demandes Publicitaires</h2>
              <span className="text-gold text-[10px]">{ads.filter(a => a.status === 'pending').length} en attente</span>
            </div>
            {ads.length === 0 ? (
              <div className="p-10 text-center">
                <Megaphone size={40} className="mx-auto text-gold/20 mb-3" />
                <p className="text-gray-500 font-playfair italic">Aucune demande publicitaire.</p>
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
                            {ad.status === 'approved' ? 'Approuvé' : ad.status === 'pending' ? 'En attente' : 'Rejeté'}
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
                              <ThumbsUp size={12} /> Approuver
                            </button>
                            <button onClick={async () => { await rejectAd(ad.id); getAllAdRequests().then(setAds); }} className="px-4 py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-red-600/30 flex items-center gap-1">
                              <ThumbsDown size={12} /> Rejeter
                            </button>
                            <button onClick={async () => { if (confirm('Supprimer ?')) { await deleteAd(ad.id); getAllAdRequests().then(setAds); } }} className="px-3 py-1.5 border border-gray-500/30 text-gray-400 text-[10px] rounded-sm hover:bg-gray-500/10">
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
              <h2 className="text-white font-bold text-sm uppercase tracking-widest">Demandes d'Abonnement</h2>
              <span className="text-gold text-[10px]">{subscriptions.filter(s => s.status === 'pending').length} en attente</span>
            </div>
            {subscriptions.length === 0 ? (
              <div className="p-10 text-center">
                <Crown size={40} className="mx-auto text-gold/20 mb-3" />
                <p className="text-gray-500 font-playfair italic">Aucune demande d'abonnement.</p>
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
                          <h3 className="text-white font-bold text-sm">{(sub as any).user?.name || 'Utilisateur'}</h3>
                          <span className={`px-2 py-0.5 text-[9px] rounded-sm uppercase tracking-widest font-bold ${sub.status === 'active' ? 'bg-green-500/20 text-green-400' : sub.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {sub.status === 'active' ? 'Actif' : sub.status === 'pending' ? 'En attente' : 'Expiré'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                          <span>{sub.amountUsd}$</span>
                          <span>•</span>
                          <span>{(sub as any).user?.phone || 'Tél. non renseigné'}</span>
                          <span>•</span>
                          <span>Demandé le {new Date(sub.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                        {sub.status === 'pending' && (
                          <div className="flex gap-2 mt-3 items-center flex-wrap">
                            <input
                              type="text"
                              value={txIdInput[sub.id] || ''}
                              onChange={e => setTxIdInput({...txIdInput, [sub.id]: e.target.value})}
                              placeholder="ID transaction Airtel Money"
                              className="px-3 py-1.5 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 text-[10px] outline-none focus:border-gold w-40"
                            />
                            <button onClick={async () => {
                              try {
                                const txId = txIdInput[sub.id];
                                if (!txId) { alert('Entrez l\'ID de transaction'); return; }
                                const ok = await approveSubscription(sub.id, txId);
                                if (!ok) { alert('Erreur lors de la validation'); return; }
                                getAllSubscriptionRequests().then(setSubscriptions);
                              } catch (e: any) { alert('Erreur: ' + e.message); }
                            }} className="px-4 py-1.5 bg-green-600/20 border border-green-500/30 text-green-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-green-600/30 flex items-center gap-1">
                              <ThumbsUp size={12} /> Valider
                            </button>
                            <button onClick={async () => {
                              try {
                                const ok = await rejectSubscription(sub.id);
                                if (!ok) { alert('Erreur lors du rejet'); return; }
                                getAllSubscriptionRequests().then(setSubscriptions);
                              } catch (e: any) { alert('Erreur: ' + e.message); }
                            }} className="px-3 py-1.5 border border-red-500/30 text-red-400 text-[10px] rounded-sm hover:bg-red-500/10">
                              <ThumbsDown size={12} /> Rejeter
                            </button>
                          </div>
                        )}
                        {sub.status !== 'pending' && (
                          <button onClick={async () => {
                            if (!confirm('Supprimer cette demande ?')) return;
                            try {
                              const ok = await deleteSubscription(sub.id);
                              if (!ok) { alert('Erreur lors de la suppression'); return; }
                              getAllSubscriptionRequests().then(setSubscriptions);
                            } catch (e: any) { alert('Erreur: ' + e.message); }
                          }} className="mt-2 text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1">
                            <Trash2 size={10} /> Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        /* Transactions List */
        <div className="bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gold/10">
            <h2 className="text-white font-bold text-sm uppercase tracking-widest">Historique des Transactions</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-10 text-center">
              <ShoppingCart size={40} className="mx-auto text-gold/20 mb-3" />
              <p className="text-gray-500 font-playfair italic">Aucune transaction pour le moment.</p>
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
                      {txn.status === 'completed' ? 'Complétée' : txn.status === 'pending_verification' ? 'Paiement signalé' : 'En attente'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600 block">Client</span>
                      <span className="text-white">{txn.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Total</span>
                      <span className="text-gold font-bold">{txn.total.toLocaleString()} CDF</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Commission</span>
                      <span className="text-green-400 font-bold">{txn.platformCommission.toLocaleString()} CDF</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Date</span>
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
                          onClick={async () => { await completeTransaction(txn.id); refresh(); }}
                          className="px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-green-600/30 transition-all"
                        >
                          <CheckCircle size={12} className="inline mr-1" /> Paiement reçu
                        </button>
                        <button
                          onClick={async () => { await cancelTransaction(txn.id); refresh(); }}
                          className="px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-red-600/30 transition-all"
                        >
                          <XCircle size={12} className="inline mr-1" /> Paiement invalide
                        </button>
                      </>
                    )}
                    {txn.status === 'pending' && (
                      <button
                        onClick={async () => { await completeTransaction(txn.id); refresh(); }}
                        className="px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-400 text-[10px] uppercase tracking-widest rounded-sm hover:bg-green-600/30 transition-all"
                      >
                        <CheckCircle size={12} className="inline mr-1" /> Marquer complétée
                      </button>
                    )}
                    <button onClick={() => setSelectedTxn(selectedTxn?.id === txn.id ? null : txn)} className="px-4 py-2 text-gold text-[10px] uppercase tracking-widest hover:underline">
                      Détails
                    </button>
                  </div>

                  {selectedTxn?.id === txn.id && (
                    <div className="mt-4 space-y-3">
                      {(txn.transactionId || txn.screenshotUrl) && (
                        <div className="p-4 bg-black/40 border border-gold/10 rounded-lg">
                          <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-3">Preuve de paiement</h4>
                          {txn.transactionId && (
                            <div className="flex items-center gap-2 text-xs mb-2">
                              <Hash size={14} className="text-gold/60" />
                              <span className="text-gray-400">ID Transaction :</span>
                              <span className="text-white font-mono font-bold">{txn.transactionId}</span>
                            </div>
                          )}
                          {txn.screenshotUrl && (
                            <div className="mt-2">
                              <a href={txn.screenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-gold/10 border border-gold/20 rounded-sm text-gold text-[10px] hover:bg-gold/20 transition-all">
                                <ImageIcon size={14} /> Voir la capture
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-4 bg-black/40 border border-gold/10 rounded-lg">
                        <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-3">Articles vendus</h4>
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
