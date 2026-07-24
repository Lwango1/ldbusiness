import { useState } from 'react';
import { X, Send, Megaphone, Globe, Image, FileText } from 'lucide-react';
import { createAdRequest, uploadProductImage } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

interface AdFormProps {
  onClose: () => void;
}

const zones = [
  { id: 'sidebar', label: 'Bannière latérale — 5$/mois (3x/jour)' },
  { id: 'popup', label: 'Pop-up — 10$/mois (6x/jour)' },
  { id: 'hero', label: 'Bannière Hero — 15$/mois (toutes les heures)' },
  { id: 'between_products', label: 'Entre les produits — 20$/mois (toutes les 30 min)' },
] as const;

const frequencies = [
  { id: 'daily_3', label: '3 fois par jour' },
  { id: 'daily_6', label: '6 fois par jour' },
  { id: 'hourly', label: 'Toutes les heures' },
  { id: 'every_30min', label: 'Toutes les 30 minutes' },
] as const;

export default function AdForm({ onClose }: AdFormProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({ brandName: '', brandWebsite: '', description: '', zone: 'sidebar', frequency: 'daily_3' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.brandName || !imageFile) {
      setError('Nom de la marque et image requis');
      return;
    }
    setUploading(true);
    setError('');

    const imageUrl = await uploadProductImage(imageFile);
    if (!imageUrl) {
      setError('Erreur lors de l\'upload de l\'image');
      setUploading(false);
      return;
    }

    const ok = await createAdRequest({
      userId: user?.id || '',
      brandName: form.brandName,
      brandWebsite: form.brandWebsite || undefined,
      imageUrl,
      description: form.description || undefined,
      zone: form.zone as any,
      frequency: form.frequency,
    });

    setUploading(false);
    if (ok) setSent(true);
    else setError('Erreur lors de l\'envoi');
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-luxury-dark border border-gold/20 rounded-xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white">
          <X size={20} />
        </button>

        {!sent ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                <Megaphone size={22} className="text-gold" />
              </div>
              <div>
                <h2 className="font-playfair text-lg text-white font-bold">Publicité LDBusiness</h2>
                <p className="text-gray-500 text-xs">Mettez votre marque en avant</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Nom de la marque *</label>
                <div className="relative">
                  <Megaphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
                  <input type="text" value={form.brandName} onChange={e => setForm({...form, brandName: e.target.value})} placeholder="Ex: Fashion House Goma" className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Site web (optionnel)</label>
                <div className="relative">
                  <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
                  <input type="url" value={form.brandWebsite} onChange={e => setForm({...form, brandWebsite: e.target.value})} placeholder="https://..." className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Fichier publicitaire * (image ou vidéo)</label>
                <label className="flex flex-col items-center justify-center h-28 bg-black border-2 border-dashed border-gold/20 rounded-sm cursor-pointer hover:border-gold/50 transition-all">
                  {imageFile ? (
                    <div className="flex items-center gap-2 text-gold text-xs">
                      {imageFile.type.startsWith('video/') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      ) : (
                        <Image size={16} />
                      )}
                      {imageFile.name}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Image size={20} />
                      <span className="text-[10px]">Image (PNG, JPG) ou Vidéo (MP4, WebM)</span>
                    </div>
                  )}
                  <input type="file" accept="image/*,video/mp4,video/webm,video/ogg" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Espace publicitaire</label>
                <select value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm">
                  {zones.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Fréquence d'affichage</label>
                <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm">
                  {frequencies.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">Description (optionnel)</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="Message ou description..." className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm" />
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button onClick={handleSubmit} disabled={uploading} className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Envoi en cours...</>
                ) : (
                  <><Send size={16} /> Envoyer la demande</>
                )}
              </button>

              <p className="text-gray-600 text-[10px] text-center">Votre demande sera examinée par l'équipe LDBusiness sous 24h.</p>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <Send size={28} className="text-green-400" />
            </div>
            <h3 className="font-playfair text-xl text-white font-bold mb-2">Demande envoyée !</h3>
            <p className="text-gray-400 text-sm mb-6">Nous étudions votre demande et vous recontacterons.</p>
            <button onClick={onClose} className="px-6 py-3 border border-gold/30 text-gold text-xs uppercase tracking-widest rounded-sm hover:bg-gold/10 transition-all">Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}
