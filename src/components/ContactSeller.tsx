import { useState } from 'react';
import { X, Send, MessageCircle, Shield } from 'lucide-react';
import { Product, formatDualPrice } from '../types';
import { sendMessage } from '../services/database';
import { useTranslation } from '../i18n';

interface ContactSellerProps {
  product: Product;
  onClose: () => void;
  onSent: () => void;
}

export default function ContactSeller({ product, onClose, onSent }: ContactSellerProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', phone: '', email: '', question: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.question) {
      setError(t('contactSeller.fillRequired'));
      return;
    }
    await sendMessage({
      productId: product.id,
      sellerId: product.sellerId,
      buyerId: 'anonymous',
      buyerName: form.name,
      buyerPhone: form.phone,
      buyerEmail: form.email,
      content: form.question,
    });
    setSent(true);
    onSent();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-luxury-dark border border-gold/20 rounded-xl p-8 max-w-md w-full shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white">
          <X size={20} />
        </button>

        {!sent ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                <MessageCircle size={22} className="text-gold" />
              </div>
              <div>
                <h2 className="font-playfair text-lg text-white font-bold">{t('contactSeller.title')}</h2>
                <p className="text-gray-500 text-xs">{product.storeName || 'LDBusiness'}</p>
              </div>
            </div>

            <div className="mb-6 p-3 bg-luxury-light/30 border border-gold/10 rounded-lg flex gap-3">
              <img src={product.image} alt={product.name} className="w-14 h-14 object-cover rounded-md" />
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{product.name}</p>
                <p className="text-gold text-xs font-bold">{formatDualPrice(product.price, product.currency).primary}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('contactSeller.yourName')}</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={t('contactSeller.namePlaceholder')} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('contactSeller.phone')}</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder={t('contactSeller.phonePlaceholder')} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('contactSeller.email')}</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder={t('contactSeller.emailPlaceholder')} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('contactSeller.question')}</label>
                <textarea value={form.question} onChange={e => setForm({...form, question: e.target.value})} rows={3} placeholder={t('contactSeller.questionPlaceholder')} className="w-full px-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm" />
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <div className="flex items-center gap-2 text-[10px] text-gold/40 mb-2">
                <Shield size={12} />
                <span>{t('contactSeller.info')}</span>
              </div>

              <button type="submit" className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all flex items-center justify-center gap-2">
                <Send size={16} /> {t('contactSeller.send')}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <Send size={28} className="text-green-400" />
            </div>
            <h3 className="font-playfair text-xl text-white font-bold mb-2">{t('contactSeller.successTitle')}</h3>
            <p className="text-gray-400 text-sm mb-6">{t('contactSeller.successMessage')}</p>
            <button onClick={onClose} className="px-6 py-3 border border-gold/30 text-gold text-xs uppercase tracking-widest rounded-sm hover:bg-gold/10 transition-all">
              {t('contactSeller.continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
