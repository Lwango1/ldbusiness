import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Save, Store, Package, LogOut, ShieldAlert, MessageCircle, MessageSquare, CheckCircle, Upload, Image as ImageIcon, Tag, Percent, PackageX } from 'lucide-react';
import { Product, Seller, Message, COMMISSION_RATE, formatDualPrice } from '../types';
import { getSellerProducts, addProduct, updateProduct, deleteProduct, getSellerMessages, markMessageRead, replyToMessage, uploadProductImage } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { isAdminAuthenticated, clearAdminAuth } from './AdminGuard';

interface SellerDashboardProps {
  seller: Seller;
}

const emptyProduct = {
  name: '', description: '', price: 0, currency: 'CDF',
  image: '', images: [], category: '', sizes: [], colors: [],
  stock: undefined, promoCode: '', discount: undefined,
};

const categoryOptions = ['Robes de Soirée', 'Costumes Homme', 'Mariage', 'Traditionnel', 'Vêtement', 'Événements', 'Accessoires', 'Cryptomonnaie', 'Automobile', 'Électronique', 'Électroménager', 'Maison', 'Autre'];

export default function SellerDashboard({ seller }: SellerDashboardProps) {
  const { user, signOut } = useAuth();
  const adminAuthed = isAdminAuthenticated();
  const effectiveUserId = user?.id || seller.id;
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [tab, setTab] = useState<'products' | 'messages'>('products');
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const refresh = async () => { const p = await getSellerProducts(effectiveUserId); setProducts(p); };
  const refreshMessages = async () => { const m = await getSellerMessages(effectiveUserId); setMessages(m); };

  useEffect(() => { refresh(); }, [effectiveUserId]);
  useEffect(() => { if (tab === 'messages') refreshMessages(); }, [tab, effectiveUserId]);

  const unreadCount = messages.filter(m => !m.read).length;

  const handleAdd = () => {
    setEditing({ ...emptyProduct });
    setShowForm(true);
  };

  const handleEdit = (p: Product) => {
    setEditing({ ...p });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer ce produit ?') && effectiveUserId) {
      await deleteProduct(id, effectiveUserId);
      refresh();
    }
  };

  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess(false);
    if (!editing || !editing.name || !editing.price || !editing.category || !effectiveUserId) {
      setSaveError('Remplissez tous les champs obligatoires.');
      return;
    }
    if (!editing.image && !editing.images?.length && !editing.id) {
      setSaveError('Ajoutez au moins une image.');
      return;
    }
    const ok = editing.id
      ? await updateProduct(editing.id, editing, effectiveUserId)
      : !!(await addProduct(editing as Omit<Product, 'id'>, effectiveUserId));
    if (!ok) {
      setSaveError('Erreur lors de la sauvegarde. Vérifiez votre connexion.');
      return;
    }
    setSaveSuccess(true);
    setShowForm(false);
    setEditing(null);
    refresh();
  };

  const handleLogout = () => {
    signOut();
    clearAdminAuth();
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Store size={20} className="text-gold" />
              <h1 className="font-playfair text-3xl font-bold text-white">{seller.storeName}</h1>
            </div>
            <p className="text-gray-500 text-sm ml-9">Bienvenue, {seller.ownerName}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd} className="flex items-center gap-2 px-5 py-3 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all">
              <Plus size={16} /> Ajouter un produit
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 border border-red-500/30 text-red-400 text-xs uppercase tracking-widest rounded-sm hover:bg-red-500/10 transition-all">
              <LogOut size={14} /> Quitter
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-6">
            <Package size={24} className="text-gold mb-2" />
            <div className="text-3xl font-bold text-white">{products.length}</div>
            <div className="text-gray-500 text-xs uppercase tracking-widest">Produits</div>
          </div>
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-6">
            <Store size={24} className="text-gold mb-2" />
            <div className="text-3xl font-bold text-white">{seller.phone}</div>
            <div className="text-gray-500 text-xs uppercase tracking-widest">Contact</div>
          </div>
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-6">
            <div className="text-gold text-2xl mb-2 font-bold">Boutique</div>
            <div className="text-gray-500 text-xs uppercase tracking-widest">Active</div>
          </div>
        </div>

        {/* Règles plateforme */}
        <div className="mb-8 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-red-400 text-xs font-bold uppercase tracking-widest mb-1">Règles de la plateforme</h3>
              <p className="text-red-300/60 text-[11px] leading-relaxed">
                Toute vente doit obligatoirement passer par le système de facturation LDBusiness.
                Les transactions en dehors de la plateforme sont strictement interdites.
                Tout vendeur pris à contourner le système sera immédiatement exclu de la plateforme.
                La commission de {COMMISSION_RATE * 100}% est déduite automatiquement sur chaque vente.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-luxury-dark/50 border border-gold/10 rounded-lg p-1 w-fit">
          <button onClick={() => setTab('products')} className={`px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-md transition-all ${tab === 'products' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'}`}>
            <Package size={14} className="inline mr-2" /> Produits
          </button>
          <button onClick={() => setTab('messages')} className={`px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-md transition-all relative ${tab === 'messages' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'}`}>
            <MessageCircle size={14} className="inline mr-2" /> Messages
            {unreadCount > 0 && <span className="ml-2 w-5 h-5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center inline-flex">{unreadCount}</span>}
          </button>
        </div>

        {/* Messages Panel */}
        {tab === 'messages' && (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gold/10 rounded-xl">
                <MessageCircle size={40} className="mx-auto text-gold/20 mb-3" />
                <p className="text-gray-500 font-playfair italic text-sm">Aucun message pour le moment.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`bg-luxury-dark border rounded-xl p-5 transition-all ${!msg.read ? 'border-gold/30' : 'border-gold/5'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-sm">{msg.buyerName}</h3>
                        {!msg.read && <span className="w-2 h-2 bg-gold rounded-full" />}
                      </div>
                      <p className="text-gray-500 text-[10px]">{msg.buyerPhone} {msg.buyerEmail && `• ${msg.buyerEmail}`}</p>
                    </div>
                    <span className="text-gray-600 text-[10px]">{new Date(msg.date).toLocaleDateString('fr-FR')}</span>
                  </div>

                  <div className="mb-3 p-3 bg-black/40 border border-gold/5 rounded-lg">
                    <p className="text-[10px] text-gold/50 uppercase tracking-widest mb-1">Produit: {msg.productName}</p>
                    <p className="text-gray-300 text-sm">{msg.content}</p>
                  </div>

                  {msg.reply && (
                    <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg mb-3">
                      <p className="text-[10px] text-green-500/70 uppercase tracking-widest mb-1">Votre réponse</p>
                      <p className="text-green-300 text-sm">{msg.reply}</p>
                    </div>
                  )}

                  {!msg.replied && replyingTo !== msg.id && (
                    <button onClick={async () => { await markMessageRead(msg.id); setReplyingTo(msg.id); refreshMessages(); }} className="px-4 py-2 bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase tracking-widest rounded-sm hover:bg-gold/20 transition-all">
                      <MessageSquare size={12} className="inline mr-1" /> Répondre
                    </button>
                  )}

                  {replyingTo === msg.id && (
                    <div className="space-y-2">
                      <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2} placeholder="Écrivez votre réponse..." className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
                      <div className="flex gap-2">
                        <button onClick={async () => { if (replyText.trim()) { await replyToMessage(msg.id, replyText); setReplyText(''); setReplyingTo(null); refreshMessages(); } }} className="px-5 py-2 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm">
                          Envoyer
                        </button>
                        <button onClick={() => setReplyingTo(null)} className="px-4 py-2 border border-gray-500/30 text-gray-400 text-xs rounded-sm">
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Products Panel */}
        {tab === 'products' && (
          products.length === 0 && !showForm ? (
          <div className="text-center py-20 border border-dashed border-gold/10 rounded-xl">
            <Package size={48} className="mx-auto text-gold/20 mb-4" />
            <p className="text-gray-500 font-playfair italic text-lg mb-4">Vous n'avez pas encore de produits.</p>
            <button onClick={handleAdd} className="px-6 py-3 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm">
              Ajouter mon premier produit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-luxury-dark border border-gold/10 rounded-xl p-5 flex gap-4">
                <div className="relative">
                  <img src={p.image} alt={p.name} className="w-24 h-24 object-contain rounded-lg border border-gold/10 bg-black" />
                  {p.stock !== undefined && p.stock === 0 && (
                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                      <span className="text-red-400 text-[9px] font-bold uppercase tracking-widest -rotate-45">Rupture</span>
                    </div>
                  )}
                  {p.discount && p.discount > 0 && p.stock !== 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm shadow-lg">
                      -{p.discount}%
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {p.discount && p.discount > 0 ? (
                      <>
                        <span className="text-gray-500 text-xs line-through">{formatDualPrice(p.price, p.currency).primary}</span>
                        <span className="text-gold font-bold text-sm">{formatDualPrice(p.price * (1 - p.discount / 100), p.currency).primary}</span>
                      </>
                    ) : (
                      <p className="text-gold font-bold text-sm">{formatDualPrice(p.price, p.currency).primary} <span className="text-gray-500">({formatDualPrice(p.price, p.currency).secondary})</span></p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-gold/10 text-gold text-[10px] rounded-sm">{p.category}</span>
                    {p.stock !== undefined && (
                      <span className={`px-2 py-0.5 text-[10px] rounded-sm ${p.stock > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        Stock: {p.stock}
                      </span>
                    )}
                    {p.promoCode && p.stock !== 0 && (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded-sm flex items-center gap-1">
                        <Tag size={10} /> {p.promoCode}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleEdit(p)} className="p-2 border border-gold/20 rounded-sm text-gold hover:bg-gold/10 transition-all">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 border border-red-500/20 rounded-sm text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Add/Edit Form Modal */}
        {showForm && editing && (
          <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-luxury-dark border border-gold/20 rounded-xl p-8 max-w-lg w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-playfair text-xl text-white font-bold">{editing.id ? 'Modifier' : 'Nouveau'} Produit</h2>
                <button onClick={() => setShowForm(false)} className="p-2 text-gray-500 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Nom du produit *</label>
                  <input type="text" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none" />
                </div>

                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Description</label>
                  <textarea value={editing.description || ''} onChange={e => setEditing({...editing, description: e.target.value})} rows={3} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Prix ({editing.currency || 'CDF'}) *</label>
                    <input type="number" value={editing.price || ''} onChange={e => setEditing({...editing, price: Number(e.target.value)})} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Catégorie *</label>
                    <select value={editing.category || ''} onChange={e => setEditing({...editing, category: e.target.value})} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none">
                      <option value="">Choisir</option>
                      {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Devise</label>
                  <select value={editing.currency || 'CDF'} onChange={e => setEditing({...editing, currency: e.target.value})} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none">
                    <option value="CDF">CDF (Franc Congolais)</option>
                    <option value="USD">USD (Dollar)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Stock *</label>
                    <div className="relative">
                      <PackageX size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
                      <input type="number" min="0" value={editing.stock ?? ''} onChange={e => setEditing({...editing, stock: e.target.value ? Number(e.target.value) : undefined})} placeholder="Quantité" className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Prix promo (optionnel)</label>
                    <div className="relative">
                      <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
                      <input type="number" min="0" max="100" value={editing.discount ?? ''} onChange={e => setEditing({...editing, discount: e.target.value ? Number(e.target.value) : undefined})} placeholder="Ex: 10 pour 10%" className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Code promo (optionnel)</label>
                  <div className="relative">
                    <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
                    <input type="text" value={editing.promoCode || ''} onChange={e => setEditing({...editing, promoCode: e.target.value})} placeholder="Ex: PROMO10" className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Images du produit * (6 max)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(editing.images || []).concat(Array(Math.max(0, 6 - (editing.images || []).length)).fill(null)).slice(0, 6).map((img, i) => (
                      <div key={i} className="relative aspect-square bg-black border-2 border-dashed border-gold/20 rounded-sm hover:border-gold/50 transition-all">
                        {img ? (
                          <>
                            <img src={img} alt="" className="w-full h-full object-contain rounded-sm bg-black" />
                            <button
                              onClick={() => {
                                const newImages = (editing.images || []).filter((_, idx) => idx !== i);
                                setEditing({...editing, images: newImages, image: newImages[0] || ''});
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px]"
                            >×</button>
                          </>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-500">
                            <Upload size={16} />
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setUploading(true);
                                  const url = await uploadProductImage(file);
                                  if (url) {
                                    const newImages = [...(editing.images || []), url];
                                    setEditing({...editing, images: newImages, image: newImages[0] || url});
                                  }
                                  setUploading(false);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                  {uploading && (
                    <div className="flex items-center gap-2 mt-2 text-gold text-[10px]">
                      <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                      Upload en cours...
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Tailles (optionnel)</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {(editing.sizes || []).map(s => (
                      <span key={s} className="px-3 py-1 bg-gold/10 text-gold text-xs rounded-sm flex items-center gap-1">
                        {s}
                        <button onClick={() => setEditing({...editing, sizes: (editing.sizes || []).filter(function(x) { return x !== s })})} className="text-red-400">X</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={sizeInput} onChange={e => setSizeInput(e.target.value)} placeholder="Ex: M, L, XL" className="flex-1 px-4 py-2 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
                    <button onClick={() => { if (sizeInput.trim()) { setEditing({...editing, sizes: [...(editing.sizes || []), sizeInput.trim()]}); setSizeInput(''); } }} className="px-3 py-2 bg-gold/20 text-gold rounded-sm text-xs">+</button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Couleurs (optionnel)</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {(editing.colors || []).map(c => (
                      <span key={c} className="px-3 py-1 bg-gold/10 text-gold text-xs rounded-sm flex items-center gap-1">
                        {c}
                        <button onClick={() => setEditing({...editing, colors: (editing.colors || []).filter(x => x !== c)})} className="text-red-400">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={colorInput} onChange={e => setColorInput(e.target.value)} placeholder="Ex: Rouge, Bleu" className="flex-1 px-4 py-2 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
                    <button onClick={() => { if (colorInput.trim()) { setEditing({...editing, colors: [...(editing.colors || []), colorInput.trim()]}); setColorInput(''); } }} className="px-3 py-2 bg-gold/20 text-gold rounded-sm text-xs">+</button>
                  </div>
                </div>

                {saveError && <p className="text-red-500 text-xs text-center">{saveError}</p>}
                {saveSuccess && <p className="text-green-500 text-xs text-center">✓ Produit enregistré</p>}

                <button onClick={handleSave} className="w-full py-4 bg-gold text-black font-bold uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all flex items-center justify-center gap-2">
                  <Save size={16} /> {editing.id ? 'Enregistrer' : 'Publier le produit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
