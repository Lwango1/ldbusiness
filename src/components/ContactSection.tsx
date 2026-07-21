import { useState } from 'react';
import * as Lucide from 'lucide-react';

export default function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/243996710821?text=Bonjour LDBusiness...", "_blank");
  };

  return (
    <section id="contact" className="py-20 px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white">Prendre Rendez-vous</h2>
          <div className="w-20 h-1 bg-[#C9A94E] mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info */}
          <div className="space-y-8">
            <div className="flex gap-4 items-center">
              <Lucide.MapPin className="text-[#C9A94E]" />
              <span className="text-gray-400">Goma, Nord-Kivu, RDC</span>
            </div>
            <button onClick={openWhatsApp} className="flex items-center gap-2 text-green-500 border border-green-500/30 p-4 rounded">
              <Lucide.MessageCircle size={20} /> Discuter sur WhatsApp
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-[#1A1A1A] p-8 border border-white/10">
            {submitted ? (
              <div className="text-center text-[#C9A94E]">Merci Daniel, message envoyé !</div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nom"
                  className="w-full bg-black border-b border-white/20 py-2 text-white outline-none"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                <button type="submit" className="w-full bg-[#C9A94E] py-3 font-bold uppercase">
                  Envoyer
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}