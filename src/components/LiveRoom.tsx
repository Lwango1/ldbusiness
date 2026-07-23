import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, ScreenShare, Users, Send, Radio, ArrowLeft, Camera } from 'lucide-react';
import { Room, createLocalAudioTrack, createLocalVideoTrack, type Participant, type RemoteTrack } from 'livekit-client';
import { getLiveById, getLiveChatMessages, sendLiveChatMessage, incrementViewers, stopLive } from '../services/database';
import { getLiveKitToken, LIVEKIT_URL } from '../services/livekit';
import { useAuth } from '../contexts/AuthContext';
import { LiveStream } from '../types';

export default function LiveRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [live, setLive] = useState<LiveStream | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [room] = useState(() => new Room());
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string; time: string; isHost?: boolean }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hostVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const identity = user?.id || `viewer_${Date.now()}`;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const l = await getLiveById(id);
      if (!cancelled && l) {
        setLive(l);
        setIsHost(user?.id === l.hostId);
        await incrementViewers(l.id);
      }
    })();
    return () => { cancelled = true; };
  }, [id, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getLiveKitToken(live.roomName, identity, user?.id === live.hostId);
        await room.connect(LIVEKIT_URL, token);
        if (cancelled) { room.disconnect(); return; }

        if (user?.id === live.hostId) {
          const videoTrack = await createLocalVideoTrack({ facingMode: 'user', resolution: { width: 1280, height: 720 } });
          await room.localParticipant.publishTrack(videoTrack, { name: 'camera' });
          const audioTrack = await createLocalAudioTrack();
          await room.localParticipant.publishTrack(audioTrack, { name: 'mic' });

          if (localVideoRef.current) {
            videoTrack.attach(localVideoRef.current);
          }
        }

        room.on('trackSubscribed', (track: RemoteTrack, _publication: any, participant: Participant) => {
          if (track.kind === 'video' && hostVideoRef.current && participant.identity !== identity) {
            track.attach(hostVideoRef.current);
          }
        });

        room.on('trackUnsubscribed', (track: RemoteTrack) => {
          track.detach();
        });
      } catch (err) {
        console.error('LiveKit connection error:', err);
      }
    })();
    return () => { room.disconnect(); };
  }, [live]);

  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!id) return;
    getLiveChatMessages(id).then(setChatMessages);
    chatPollRef.current = setInterval(async () => {
      const msgs = await getLiveChatMessages(id);
      setChatMessages(msgs);
    }, 2000);
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [id]);

  const toggleCamera = useCallback(async () => {
    if (isCameraOn) {
      const pubs = room.localParticipant.getTrackPublications();
      for (const pub of pubs) {
        if (pub.track?.kind === 'video' && pub.track) room.localParticipant.unpublishTrack(pub.track);
      }
      setIsCameraOn(false);
    } else {
      const videoTrack = await createLocalVideoTrack({ facingMode: 'user', resolution: { width: 1280, height: 720 } });
      await room.localParticipant.publishTrack(videoTrack, { name: 'camera' });
      if (localVideoRef.current) videoTrack.attach(localVideoRef.current);
      setIsCameraOn(true);
    }
  }, [isCameraOn, room]);

  const toggleMic = useCallback(async () => {
    if (isMicOn) {
      room.localParticipant.getTrackPublications().forEach(pub => {
        if (pub.track?.kind === 'audio' && pub.track) room.localParticipant.unpublishTrack(pub.track);
      });
      setIsMicOn(false);
    } else {
      const audioTrack = await createLocalAudioTrack();
      await room.localParticipant.publishTrack(audioTrack, { name: 'mic' });
      setIsMicOn(true);
    }
  }, [isMicOn, room]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      room.localParticipant.getTrackPublications().forEach(pub => {
        if (pub.track?.kind === 'video' && pub.track) room.localParticipant.unpublishTrack(pub.track);
      });
      setIsScreenSharing(false);
      const videoTrack = await createLocalVideoTrack({ facingMode: 'user', resolution: { width: 1280, height: 720 } });
      await room.localParticipant.publishTrack(videoTrack, { name: 'camera' });
      if (localVideoRef.current) videoTrack.attach(localVideoRef.current);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        room.localParticipant.getTrackPublications().forEach(pub => {
          if (pub.track?.kind === 'video' && pub.track) room.localParticipant.unpublishTrack(pub.track);
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        await room.localParticipant.publishTrack(screenTrack, { name: 'screenshare' });
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
        screenTrack.onended = () => toggleCamera();
      } catch (err) { console.error(err); }
    }
  }, [isScreenSharing, room, toggleCamera]);

  const handleStopLive = useCallback(async () => {
    if (live) await stopLive(live.id);
    room.disconnect();
    navigate('/live');
  }, [live, room, navigate]);

  const handleSendMessage = async () => {
    if (message.trim() && live && user) {
      await sendLiveChatMessage(live.id, user.user_metadata?.full_name || 'Anonyme', message, isHost);
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
                  <video ref={localVideoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover ${isCameraOn ? '' : 'hidden'}`} />
                  {!isCameraOn && (
                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                      <div className="text-center">
                        <Camera size={40} className="text-gold/50 mx-auto mb-2" />
                        <p className="text-gray-500">Caméra désactivée</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <video ref={hostVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                        <Radio size={36} className="text-gold" />
                      </div>
                      <p className="text-gold font-playfair text-lg">En direct</p>
                      <p className="text-gray-500 text-xs mt-1">{live.hostName}</p>
                    </div>
                  </div>
                </>
              )}

              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-sm shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                <span className="text-white text-[10px] font-black">LIVE</span>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
                <Users size={12} className="text-gold" />
                <span className="text-white text-xs font-bold">{live.viewerCount}</span>
              </div>

              {isHost && (
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
              )}
            </div>

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
                <div key={i} className={`flex flex-col ${msg.user === 'Vous' || (user && msg.user === user.user_metadata?.full_name) ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[9px] font-bold ${msg.isHost ? 'text-gold' : 'text-gray-500'}`}>{msg.user}</span>
                    <span className="text-[8px] text-gray-700">{msg.time}</span>
                  </div>
                  <div className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs ${
                    msg.isHost
                    ? 'bg-gold/10 border border-gold/20 text-gold'
                    : user && msg.user === user.user_metadata?.full_name ? 'bg-gold text-black rounded-tr-none' : 'bg-luxury-light text-gray-300 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {user && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
