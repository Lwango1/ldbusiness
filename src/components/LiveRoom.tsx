import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, ScreenShare, Users, Send, Radio, ArrowLeft, Camera } from 'lucide-react';
import { getLiveById, getLiveChatMessages, sendLiveChatMessage, incrementViewers, stopLive } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { LiveStream } from '../types';

export default function LiveRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [live, setLive] = useState<LiveStream | null>(null);
  const isHost = live && user ? true : false;

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string; time: string; isHost?: boolean }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!id) return;
    getLiveById(id).then(l => { if (l) { setLive(l); incrementViewers(l.id); } });
    getLiveChatMessages(id).then(setChatMessages);
    const interval = setInterval(async () => {
      const msgs = await getLiveChatMessages(id);
      setChatMessages(msgs);
    }, 2000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: isMicOn,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Erreur caméra:', err);
    }
  };

  useEffect(() => {
    if (isHost && videoRef.current) {
      startCamera();
    }
  }, [isHost]);

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(t => t.stop());
      }
      setIsCameraOn(false);
    } else {
      await startCamera();
      setIsCameraOn(true);
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = !isMicOn; });
    }
    setIsMicOn(!isMicOn);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await startCamera();
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
        if (streamRef.current) streamRef.current.getVideoTracks().forEach(t => t.stop());
        if (videoRef.current) videoRef.current.srcObject = screenStream;
        streamRef.current = screenStream;
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => { startCamera(); setIsScreenSharing(false); };
      } catch (err) { console.error(err); }
    }
  };

  const handleStopLive = async () => {
    if (live) await stopLive(live.id);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    navigate('/live');
  };

  const handleSendMessage = async () => {
    if (message.trim() && live) {
      await sendLiveChatMessage(live.id, user?.user_metadata?.full_name || 'Anonyme', message, isHost);
      const msgs = await getLiveChatMessages(live.id);
      setChatMessages(msgs);
      setMessage('');
    }
  };

  if (!live) {
    return (
      <div className="min-h-screen pt-28 px-6 bg-luxury-black flex flex-col items-center justify-center">
        <Radio size={48} className="text-gold/30 mb-4" />
        <p className="text-gray-400 font-playfair text-lg">Live introuvable</p>
        <button onClick={() => navigate('/live')} className="mt-4 text-gold text-xs uppercase tracking-widest">Retour aux lives</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <button onClick={() => navigate('/live')} className="flex items-center gap-2 text-gold/60 hover:text-gold mb-4 text-xs uppercase tracking-widest transition-all">
          <ArrowLeft size={16} /> Tous les lives
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Zone Vidéo */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video bg-luxury-dark rounded-xl overflow-hidden border border-gold/20 shadow-2xl">
              {isHost ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover ${isCameraOn ? '' : 'hidden'}`} />
                  {!isCameraOn && (
                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                      <div className="text-center">
                        <Camera size={40} className="text-gold/50 mx-auto mb-2" />
                        <p className="text-gray-500">Caméra désactivée</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-sm shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                    <span className="text-white text-[10px] font-black">LIVE</span>
                  </div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                    <button onClick={toggleCamera} className={`p-3 rounded-full backdrop-blur-md border transition-all ${isCameraOn ? 'bg-white/10 border-white/20' : 'bg-red-600/80 border-red-400'} text-white`}>
                      {isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
                    </button>
                    <button onClick={toggleMic} className={`p-3 rounded-full backdrop-blur-md border transition-all ${isMicOn ? 'bg-white/10 border-white/20' : 'bg-red-600/80 border-red-400'} text-white`}>
                      {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
                    </button>
                    <button onClick={toggleScreenShare} className={`p-3 rounded-full backdrop-blur-md border transition-all ${isScreenSharing ? 'bg-gold text-black' : 'bg-white/10 border-white/20 text-white'}`}>
                      <ScreenShare size={16} />
                    </button>
                    <button onClick={handleStopLive} className="px-5 py-2.5 bg-white/90 text-black font-bold text-[10px] rounded-full uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                      Terminer
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                      <Radio size={36} className="text-gold" />
                    </div>
                    <p className="text-gold font-playfair text-lg">En direct</p>
                      <p className="text-gray-500 text-xs mt-1">{live?.hostName}</p>
                  </div>
                </div>
              )}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
                <Users size={12} className="text-gold" />
                <span className="text-white text-xs font-bold">{live.viewerCount}</span>
              </div>
            </div>

            {/* Info live */}
            <div className="bg-luxury-dark border border-gold/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-sm font-bold">
                  {live.hostName.charAt(0)}
                </div>
                <div>
                  <h1 className="text-white font-playfair text-xl font-bold">{live.title}</h1>
                  <p className="text-gold/60 text-xs">{live.hostName} • {live.category}</p>
                </div>
              </div>
              {live.description && <p className="text-gray-500 text-sm">{live.description}</p>}
            </div>
          </div>

          {/* Chat */}
          <div className="flex flex-col h-[500px] lg:h-[calc(100vh-200px)] bg-luxury-dark border border-gold/20 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-luxury-light border-b border-gold/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                <span className="text-white font-bold text-xs uppercase tracking-widest">Chat</span>
              </div>
              <span className="text-gray-500 text-[10px]">{chatMessages.length} messages</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-sm italic">Soyez le premier à écrire !</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.user === 'Vous' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[9px] font-bold ${msg.isHost ? 'text-gold' : 'text-gray-500'}`}>{msg.user}</span>
                    <span className="text-[8px] text-gray-700">{msg.time}</span>
                  </div>
                  <div className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs ${
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

            <div className="p-4 bg-luxury-light/50 border-t border-gold/10">
              <div className="flex gap-2 bg-black/40 p-1 rounded-full border border-gold/10">
                <input
                  type="text"
                  placeholder="Écrivez un message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 bg-transparent text-white text-sm outline-none"
                />
                <button onClick={handleSendMessage} className="p-2.5 bg-gold text-black rounded-full hover:scale-105 transition-transform">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
