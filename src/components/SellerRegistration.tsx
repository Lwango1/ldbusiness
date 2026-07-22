import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, User, Phone, Mail, FileText, LogIn } from 'lucide-react';
import { registerSeller } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

interface SellerRegistrationProps {
  onRegistered: () => void;
}

export default function SellerRegistration({ onRegistered }: SellerRegistrationProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({ storeName: '', ownerName: '', phone: '', email: '', description: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.storeName || !form.ownerName || !form.phone || !user) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    await registerSeller(user.id, { storeName: form.storeName, description: form.description });
    onRegistered();
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-luxury-black flex items-start justify-center">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
            <Store size={28} className="text-gold" />
          </div>
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-2">
            Devenir Vendeur
          </h1>
          <p className="text-gray-500 text-sm">Créez votre boutique sur LDBusiness</p>
        </div>

        {!user && (
          <div className="bg-luxury-dark border border-gold/10 rounded-xl p-8 mb-6 text-center">
            <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
              <LogIn size={24} className="text-gold" />
            </div>
            <h2 className="font-playfair text-xl text-white font-bold mb-2">Connectez-vous d'abord</h2>
            <p className="text-gray-500 text-sm mb-6">Vous devez être connecté pour devenir vendeur.</p>
            <Link to="/" className="inline-block px-8 py-3 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all">
              Se connecter
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`space-y-5 bg-luxury-dark border border-gold/10 rounded-xl p-8 ${!user ? 'opacity-40 pointer-events-none' : ''}`}>
          <div>
            <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">Nom de la boutique *</label>
            <div className="relative">
              <Store size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
              <input type="text" value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} placeholder="Ex: Mode Luxe Goma" className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">Nom du propriétaire *</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
              <input type="text" value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} placeholder="Votre nom complet" className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">Téléphone *</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+243 XX XXX XXXX" className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">Email (optionnel)</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@exemple.com" className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">Description de la boutique</label>
            <div className="relative">
              <FileText size={16} className="absolute left-4 top-3 text-gold/40" />
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} placeholder="Parlez de votre boutique..." className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none transition-all" />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button type="submit" className="w-full py-4 bg-gold text-black font-bold uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all">
            Créer ma boutique
          </button>
        </form>
      </div>
    </div>
  );
}
