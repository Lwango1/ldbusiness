import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, User, Phone, Mail, FileText, LogIn } from 'lucide-react';
import { registerSeller } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';

interface SellerRegistrationProps {
  onRegistered: () => void;
}

export default function SellerRegistration({ onRegistered }: SellerRegistrationProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({ storeName: '', ownerName: '', phone: '', email: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.storeName || !form.ownerName || !form.phone) {
      setError(t('seller.fillRequired'));
      return;
    }
    if (!user) {
      setError(t('seller.loginError'));
      return;
    }
    setLoading(true);
    try {
      await registerSeller(user.id, {
        storeName: form.storeName,
        description: form.description,
        ownerName: form.ownerName,
        phone: form.phone,
      });
      onRegistered();
    } catch (err: any) {
      setError(err.message || t('seller.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black flex items-start justify-center">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
            <Store size={28} className="text-gold" />
          </div>
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-2">
            {t('seller.title')}
          </h1>
          <p className="text-gray-500 text-sm">{t('seller.description')}</p>
        </div>

        {!user && (
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-8 mb-6 text-center">
            <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
              <LogIn size={24} className="text-gold" />
            </div>
            <h2 className="font-playfair text-xl text-white font-bold mb-2">{t('seller.loginFirst')}</h2>
            <p className="text-gray-500 text-sm mb-6">{t('seller.loginRequired')}</p>
            <Link to="/" className="inline-block px-8 py-3 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all">
              {t('seller.login')}
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`space-y-5 bg-luxury-dark border border-gold/10 rounded-xl p-8 ${!user ? 'opacity-40 pointer-events-none' : ''}`}>
          <div>
            <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">{t('seller.storeName')}</label>
            <div className="relative">
              <Store size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
              <input type="text" value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} placeholder={t('seller.storeNamePlaceholder')} className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">{t('seller.ownerName')}</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
              <input type="text" value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} placeholder={t('seller.ownerNamePlaceholder')} className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">{t('seller.phone')}</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder={t('seller.phonePlaceholder')} className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">{t('seller.email')}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder={t('seller.emailPlaceholder')} className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">{t('seller.description')}</label>
            <div className="relative">
              <FileText size={16} className="absolute left-4 top-3 text-gold/40" />
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} placeholder={t('seller.descriptionPlaceholder')} className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none transition-all" />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button type="submit" disabled={loading} className="w-full py-4 bg-gold text-black font-bold uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30">
            {loading ? t('seller.creating') : t('seller.create')}
          </button>
        </form>
      </div>
    </div>
  );
}
