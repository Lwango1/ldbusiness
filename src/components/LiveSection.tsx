import { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, Monitor, Users, MessageSquare, Send, Radio } from 'lucide-react';

export default function LiveSection() {
  const [isLive, setIsLive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [message, setMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState([
    { user: 'Marie K.', text: 'Cette robe est magnifique! 😍', time: '14:32' },
    { user: 'Jean-Paul M.', text: 'Quelles tailles sont disponibles?', time: '14:33' },
    { user: 'Levine Mande', text: 'Bonjour à tous! Bienvenue au live. Toutes les tailles sont disponibles.', time: '14:34', isHost: true },
    { user: 'Grace L.', text: 'Le prix pour la robe émeraude?', time: '14:35' },
  ]);

  // Scroll automatique vers le bas du chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (message.trim()) {
      const now = new Date();
      setMessages([...messages, {
        user: 'Vous',
        text: message,
        time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
      }]);
      setMessage('');
    }
  };

  return (
    <section id="live" className="py-20 px-4 bg-gradient-to-b from-luxury-black via-luxury-dark to-luxury-black">
      <div className="max-w-7xl mx-auto">

        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Radio className={`${isLive ? 'text-red-500 animate-pulse' : 'text-gray-600'}`} size={16} />
            <span className={`${isLive ? 'text-red-500' : 'text-gray-600'} text-xs uppercase tracking-[0.3em] font-bold`}>
              {isLive ? 'En Direct' : 'Studio Live'}
            </span>
          </div>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mt-2 mb-4">
            <span className="gold-shimmer">Showroom Live</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ZONE VIDÉO (Prend plus de place sur desktop) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-video bg-luxury-dark rounded-xl overflow-hidden border border-gold/20 shadow-2xl">
              {isLive ? (
                <>
                  {/* Vue Simulation Live */}
                  <div className="absolute inset-0 bg-black flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="w-24 h-24 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4 pulse-glow">
                        <Video size={40} className="text-gold" />
                      </div>
                      <p className="text-gold font-playfair text-xl">Diffusion en cours</p>
                      <p className="text-gray-500 text-xs mt-2 italic">Kinshasa Showroom Principal</p>
                    </div>
                  </div>

                  {/* Badge LIVE */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-sm shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                    <span className="text-white text-[10px] font-black">LIVE</span>
                  </div>

                  {/* Boutons de contrôle (Positionnés pour les pouces sur mobile) */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                    <button onClick={() => setIsCameraOn(!isCameraOn)} className={`p-4 rounded-full backdrop-blur-md border ${isCameraOn ? 'bg-white/10 border-white/20' : 'bg-red-600 border-red-400'} text-white`}>
                      {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                    </button>
                    <button onClick={() => setIsMicOn(!isMicOn)} className={`p-4 rounded-full backdrop-blur-md border ${isMicOn ? 'bg-white/10 border-white/20' : 'bg-red-600 border-red-400'} text-white`}>
                      {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                    </button>
                    <button onClick={() => setIsLive(false)} className="px-8 py-4 bg-white text-black font-bold text-xs rounded-full uppercase tracking-widest hover:bg-gold transition-colors">
                      Quitter
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                  <div>
                    <h3 className="font-playfair text-2xl text-white mb-4">Prêt pour le direct ?</h3>
                    <button
                      onClick={() => setIsLive(true)}
                      className="px-10 py-4 bg-gold text-black font-bold rounded-sm text-xs uppercase tracking-tighter flex items-center gap-3 mx-auto shadow-xl shadow-gold/10"
                    >
                      <Radio size={18} /> Lancer la session
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Prochains rendez-vous */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-4 bg-luxury-dark/50 border border-gold/10 rounded-lg flex items-center gap-4">
                  <div className="text-gold font-bold border-r border-gold/20 pr-4">20h</div>
                  <div className="text-sm">
                    <p className="text-white font-medium">Nocturne Luxe</p>
                    <p className="text-gray-500 text-xs">Défilé privé</p>
                  </div>
               </div>
               <div className="p-4 bg-luxury-dark/50 border border-gold/10 rounded-lg flex items-center gap-4">
                  <div className="text-gold font-bold border-r border-gold/20 pr-4">Dem.</div>
                  <div className="text-sm">
                    <p className="text-white font-medium">Questions/Réponses</p>
                    <p className="text-gray-500 text-xs">Avec Levine Mande</p>
                  </div>
               </div>
            </div>
          </div>

          {/* CHAT (Optimisé pour la lecture) */}
          <div className="flex flex-col h-[500px] bg-luxury-dark border border-gold/20 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-luxury-light border-b border-gold/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                <span className="text-white font-bold text-xs uppercase tracking-widest">Chat Direct</span>
              </div>
              <Users size={14} className="text-gold/50" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.user === 'Vous' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold ${msg.isHost ? 'text-gold' : 'text-gray-500'}`}>
                      {msg.user}
                    </span>
                    <span className="text-[9px] text-gray-700">{msg.time}</span>
                  </div>
                  <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                    msg.isHost
                    ? 'bg-gold/10 border border-gold/20 text-gold'
                    : msg.user === 'Vous' ? 'bg-gold text-black rounded-tr-none' : 'bg-luxury-light text-gray-300 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Chat */}
            <div className="p-4 bg-luxury-light/50">
              <div className="flex gap-2 bg-black/40 p-1 rounded-full border border-gold/10">
                <input
                  type="text"
                  placeholder="Posez votre question..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 px-4 py-2 bg-transparent text-white text-sm outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="p-3 bg-gold text-black rounded-full hover:scale-105 transition-transform"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}