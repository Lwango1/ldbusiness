import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Eye, Play, X, Clock } from 'lucide-react';
import { LiveStream } from '../types';
import { getActiveLives, startLive } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

export default function LiveSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lives, setLives] = useState<LiveStream[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Mode' });

  useEffect(() => { getActiveLives().then(setLives); }, []);

  const categories = ['Mode', 'Artisanat', 'Défilé', 'Questions/Réponses', 'Événement', 'Automobile', 'Électronique', 'Électroménager', 'Maison', 'Autre'];

  const handleStartLive = async () => {
    if (!form.title || !user) return;
    const hostName = user.user_metadata?.full_name || 'LDBusiness';
    const live = await startLive({
      hostId: user.id,
      hostName,
      title: form.title,
      description: form.description,
      category: form.category,
    });
    if (live) navigate(`/live/${live.id}`);
  };

  return (
    <section id="live" className="py-20 px-4 bg-gradient-to-b from-luxury-black via-luxury-dark to-luxury-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Radio className="text-red-500 animate-pulse" size={16} />
            <span className="text-red-500 text-xs uppercase tracking-[0.3em] font-bold">En Direct</span>
          </div>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mt-2 mb-4">
            <span className="gold-shimmer">Showroom Live</span>
          </h2>
          <p className="text-gray-500 text-sm">Regardez les lives en cours ou lancez le vôtre</p>
        </div>

        {/* Lancez votre live */}
        <div className="text-center mb-12">
          <button
            onClick={() => setShowForm(true)}
            className="px-8 py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all inline-flex items-center gap-2"
          >
            <Radio size={18} /> Lancer mon Live
          </button>
        </div>

        {/* Liste des lives */}
        {lives.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gold/10 rounded-xl">
            <Radio size={48} className="mx-auto text-gold/20 mb-4" />
            <p className="text-gray-500 font-playfair italic text-lg mb-2">Aucun live en cours</p>
            <p className="text-gray-600 text-sm">Soyez le premier à lancer un live !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lives.map(live => (
              <div
                key={live.id}
                onClick={() => navigate(`/live/${live.id}`)}
                className="group bg-luxury-dark border border-gold/10 rounded-xl overflow-hidden hover:border-gold/30 transition-all cursor-pointer"
              >
                <div className="relative aspect-video bg-black">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                      <Radio size={28} className="text-gold" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 px-2.5 py-1 rounded-sm">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    <span className="text-white text-[10px] font-black">LIVE</span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full">
                    <Eye size={12} className="text-white" />
                    <span className="text-white text-[10px] font-bold">{live.viewerCount}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-xs font-bold">
                      {live.hostName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{live.hostName}</p>
                      <span className="text-gold/60 text-[10px] uppercase tracking-wider">{live.category}</span>
                    </div>
                  </div>
                  <h3 className="text-white font-playfair text-lg font-bold mt-2 group-hover:text-gold transition-colors">
                    {live.title}
                  </h3>
                  {live.description && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{live.description}</p>
                  )}
                  <div className="flex items-center gap-1 text-gray-600 text-[10px] mt-3">
                    <Clock size={10} />
                    <span>Commencé {new Date(live.createdAt).toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Lancement Live */}
        {showForm && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowForm(false)} />
            <div className="relative bg-luxury-dark border border-gold/20 rounded-xl p-8 max-w-md w-full shadow-2xl">
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white">
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                  <Radio size={22} className="text-gold" />
                </div>
                <div>
                  <h2 className="font-playfair text-lg text-white font-bold">Lancer un live</h2>
                  <p className="text-gray-500 text-xs">{user?.user_metadata?.full_name || 'LDBusiness'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Titre du live *</label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Défilé Haute Couture" className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="Décrivez votre live..." className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Catégorie</label>
                  <div className="flex gap-2 flex-wrap">
                    {categories.map(c => (
                      <button key={c} onClick={() => setForm({...form, category: c})} className={`px-4 py-2 text-xs rounded-sm border transition-all ${form.category === c ? 'bg-gold text-black border-gold' : 'border-gold/20 text-gray-400 hover:border-gold/40'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-gray-600 text-[10px]">
                  En lançant un live, votre session apparaîtra dans la liste des directs. Les visiteurs pourront vous rejoindre et interagir via le chat.
                </p>

                <button onClick={handleStartLive} disabled={!form.title} className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                  <Play size={16} /> Démarrer le live
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
