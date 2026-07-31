import { useState } from 'react';
import { X, Send, Megaphone, Globe, Image, FileText } from 'lucide-react';
import { createAdRequest, uploadProductImage } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';

interface AdFormProps {
  onClose: () => void;
}

const zones = [
  { id: 'sidebar', labelKey: 'adForm.zoneSidebar' },
  { id: 'popup', labelKey: 'adForm.zonePopup' },
  { id: 'hero', labelKey: 'adForm.zoneHero' },
  { id: 'between_products', labelKey: 'adForm.zoneBetween' },
] as const;

const frequencies = [
  { id: 'daily_3', labelKey: 'adForm.freq3' },
  { id: 'daily_6', labelKey: 'adForm.freq6' },
  { id: 'hourly', labelKey: 'adForm.freqHourly' },
  { id: 'every_30min', labelKey: 'adForm.freq30min' },
] as const;

export default function AdForm({ onClose }: AdFormProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState({ brandName: '', brandWebsite: '', description: '', zone: 'sidebar', frequency: 'daily_3' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.brandName || !imageFile) {
      setError(t('adForm.brandImageRequired'));
      return;
    }
    setUploading(true);
    setError('');

    const imageUrl = await uploadProductImage(imageFile);
    if (!imageUrl) {
      setError(t('adForm.uploadError'));
      setUploading(false);
      return;
    }

    const result = await createAdRequest({
      userId: user?.id || '',
      brandName: form.brandName,
      brandWebsite: form.brandWebsite || undefined,
      imageUrl,
      description: form.description || undefined,
      zone: form.zone as any,
      frequency: form.frequency,
    });

    setUploading(false);
    if (result.ok) setSent(true);
    else setError(result.error || t('adForm.sendError'));
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
                <h2 className="font-playfair text-lg text-white font-bold">{t('ad.title')}</h2>
                <p className="text-gray-500 text-xs">{t('ad.description')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('adForm.brandName')}</label>
                <div className="relative">
                  <Megaphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
                  <input type="text" value={form.brandName} onChange={e => setForm({...form, brandName: e.target.value})} placeholder={t('adForm.brandPlaceholder')} className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('adForm.website')}</label>
                <div className="relative">
                  <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
                  <input type="url" value={form.brandWebsite} onChange={e => setForm({...form, brandWebsite: e.target.value})} placeholder={t('adForm.websitePlaceholder')} className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('adForm.file')}</label>
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
                      <span className="text-[10px]">{t('adForm.fileHint')}</span>
                    </div>
                  )}
                  <input type="file" accept="image/*,video/mp4,video/webm,video/ogg" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('adForm.zone')}</label>
                <select value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm">
                  {zones.map(z => <option key={z.id} value={z.id}>{t(z.labelKey)}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('adForm.frequency')}</label>
                <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm">
                  {frequencies.map(f => <option key={f.id} value={f.id}>{t(f.labelKey)}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('adForm.description')}</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder={t('adForm.descriptionPlaceholder')} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm" />
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button onClick={handleSubmit} disabled={uploading} className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> {t('adForm.sending')}</>
                ) : (
                  <><Send size={16} /> {t('adForm.send')}</>
                )}
              </button>

              <p className="text-gray-600 text-[10px] text-center">{t('adForm.reviewNotice')}</p>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <Send size={28} className="text-green-400" />
            </div>
            <h3 className="font-playfair text-xl text-white font-bold mb-2">{t('adForm.successTitle')}</h3>
            <p className="text-gray-400 text-sm mb-6">{t('adForm.successMessage')}</p>
            <button onClick={onClose} className="px-6 py-3 border border-gold/30 text-gold text-xs uppercase tracking-widest rounded-sm hover:bg-gold/10 transition-all">{t('adForm.close')}</button>
          </div>
        )}
      </div>
    </div>
  );
}
