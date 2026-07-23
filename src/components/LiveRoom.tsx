import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, ScreenShare, Users, Send, Radio, ArrowLeft, Camera, MessageCircle, X, Loader, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { Room, type RemoteParticipant, type RemoteTrack } from 'livekit-client';
import { getLiveById, sendLiveChatMessage, incrementViewers, stopLive } from '../services/database';
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
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState('');
  const [startingCamera, setStartingCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string; time: string; isHost?: boolean }[]>([]);
  const [participants, setParticipants] = useState<{ identity: string; name: string; isHost: boolean }[]>([]);
  const [chatTab, setChatTab] = useState<'messages' | 'participants'>('messages');
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [endingLive, setEndingLive] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const hostVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    if (showChat) setTimeout(() => chatInputRef.current?.focus(), 100);
  }, [showChat]);

  // Connect to LiveKit
  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    setError('');

    const attachVideo = (track: RemoteTrack) => {
      if (hostVideoRef.current) {
        track.attach(hostVideoRef.current);
        setHasRemoteVideo(true);
      }
    };

    const attachAudio = (track: RemoteTrack) => {
      if (audioRef.current) {
        track.attach(audioRef.current);
        audioRef.current.play().catch(() => {});
      }
    };

    const updateParticipants = () => {
      const list: { identity: string; name: string; isHost: boolean }[] = [];
      if (live && isHost) {
        list.push({ identity: user?.id || '', name: live.hostName, isHost: true });
      } else if (live) {
        list.push({ identity: live.hostId, name: live.hostName, isHost: true });
      }
      room.remoteParticipants.forEach(p => {
        if (p.identity !== live?.hostId) {
          list.push({ identity: p.identity, name: p.name || p.identity, isHost: false });
        }
      });
      setParticipants(list);
    };

    room.on('trackSubscribed', (track: RemoteTrack, _publication: any, participant: RemoteParticipant) => {
      if (participant.identity === room.localParticipant?.identity) return;
      if (track.kind === 'video') attachVideo(track);
      if (track.kind === 'audio') attachAudio(track);
    });

    room.on('trackUnsubscribed', (track: RemoteTrack) => {
      track.detach();
      if (track.kind === 'video') setHasRemoteVideo(false);
    });

    room.on('participantConnected', (participant: RemoteParticipant) => {
      updateParticipants();
      participant.trackPublications.forEach(pub => {
        if (pub.track && participant.identity !== room.localParticipant?.identity) {
          if (pub.kind === 'video' && hostVideoRef.current) {
            (pub.track as RemoteTrack).attach(hostVideoRef.current);
            setHasRemoteVideo(true);
          }
          if (pub.kind === 'audio' && audioRef.current) {
            (pub.track as RemoteTrack).attach(audioRef.current);
            audioRef.current.play().catch(() => {});
          }
        }
      });
    });

    room.on('participantDisconnected', () => updateParticipants());

    (async () => {
      try {
        const token = await getLiveKitToken(live.roomName, identity, user?.id === live.hostId, live.hostName);
        if (cancelled) return;
        await room.connect(LIVEKIT_URL, token);
        if (cancelled) { room.disconnect(); return; }

        updateParticipants();

        // Backup: check tracks already subscribed
        room.remoteParticipants.forEach(participant => {
          participant.trackPublications.forEach(pub => {
            if (pub.track && participant.identity !== room.localParticipant?.identity) {
              if (pub.kind === 'video' && hostVideoRef.current) {
                (pub.track as RemoteTrack).attach(hostVideoRef.current);
                setHasRemoteVideo(true);
              }
              if (pub.kind === 'audio' && audioRef.current) {
                (pub.track as RemoteTrack).attach(audioRef.current);
                audioRef.current.play().catch(() => {});
              }
            }
          });
        });
      } catch (err: any) {
        console.error('LiveKit connection error:', err);
        setError(err.message || 'Erreur de connexion au live');
      }
    })();
    return () => { room.disconnect(); setHasRemoteVideo(false); setCameraStarted(false); };
  }, [live]);

  const startCamera = useCallback(async (facing?: 'user' | 'environment') => {
    setStartingCamera(true);
    setError('');
    try {
      const fMode = facing || facingMode;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: fMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      await room.localParticipant.publishTrack(videoTrack, { name: 'camera' });
      await room.localParticipant.publishTrack(audioTrack, { name: 'mic' });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      if (facing) setFacingMode(facing);
      setCameraStarted(true);
      setIsCameraOn(true);
      setIsMicOn(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setError(err.message || 'Impossible d\'accéder à la caméra');
    }
    setStartingCamera(false);
  }, [room, facingMode]);

  const flipCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    const oldStream = streamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const videoTrack = stream.getVideoTracks()[0];
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      if (oldStream) oldStream.getVideoTracks().forEach(t => t.stop());

      room.localParticipant.getTrackPublications().forEach(pub => {
        if (pub.track?.kind === 'video' && pub.track?.mediaStreamTrack) room.localParticipant.unpublishTrack(pub.track.mediaStreamTrack);
      });
      await room.localParticipant.publishTrack(videoTrack, { name: 'camera' });
      setFacingMode(newMode);
    } catch (err) {
      console.error('Flip camera error:', err);
      setError('Impossible de changer de caméra');
    }
  }, [facingMode, room]);

  const toggleCamera = useCallback(async () => {
    if (isCameraOn) {
      room.localParticipant.getTrackPublications().forEach(pub => {
        if (pub.track?.kind === 'video' && pub.track?.mediaStreamTrack) room.localParticipant.unpublishTrack(pub.track.mediaStreamTrack);
      });
      if (streamRef.current) streamRef.current.getVideoTracks().forEach(t => t.stop());
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        const videoTrack = stream.getVideoTracks()[0];
        const oldStream = streamRef.current;
        streamRef.current = stream;

        if (oldStream) oldStream.getVideoTracks().forEach(t => t.stop());
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        await room.localParticipant.publishTrack(videoTrack, { name: 'camera' });
        setIsCameraOn(true);
      } catch (err) {
        console.error(err);
        setError('Impossible d\'accéder à la caméra');
      }
    }
  }, [isCameraOn, room]);

  const toggleMic = useCallback(async () => {
    if (isMicOn) {
      room.localParticipant.getTrackPublications().forEach(pub => {
        if (pub.track?.kind === 'audio' && pub.track?.mediaStreamTrack) room.localParticipant.unpublishTrack(pub.track.mediaStreamTrack);
      });
      if (streamRef.current) streamRef.current.getAudioTracks().forEach(t => t.stop());
      setIsMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        const audioTrack = stream.getAudioTracks()[0];
        if (streamRef.current) {
          streamRef.current.addTrack(audioTrack);
        } else {
          streamRef.current = stream;
        }
        await room.localParticipant.publishTrack(audioTrack, { name: 'mic' });
        setIsMicOn(true);
      } catch (err) {
        console.error(err);
        setError('Impossible d\'accéder au microphone');
      }
    }
  }, [isMicOn, room]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      await startCamera();
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (streamRef.current) {
          streamRef.current.getVideoTracks().forEach(t => t.stop());
        }
        streamRef.current = screenStream;
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

        room.localParticipant.getTrackPublications().forEach(pub => {
          if (pub.track?.kind === 'video' && pub.track?.mediaStreamTrack) room.localParticipant.unpublishTrack(pub.track.mediaStreamTrack);
        });
        await room.localParticipant.publishTrack(screenTrack, { name: 'screenshare' });
        setIsScreenSharing(true);

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          startCamera();
        };
      } catch (err) { console.error(err); }
    }
  }, [isScreenSharing, room, startCamera]);

  // Warn before leaving page while live
  useEffect(() => {
    if (!isHost) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isHost]);

  const handleStopLive = useCallback(async () => {
    setEndingLive(true);
    try {
      if (live) await stopLive(live.id);
    } catch (err) {
      console.error('Failed to stop live in DB:', err);
    }
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    room.disconnect();
    navigate('/live');
  }, [live, room, navigate]);

  const handleSendMessage = async () => {
    if (!message.trim() || !live) return;
    const senderName = user?.user_metadata?.full_name || (identity === live.hostId ? live.hostName : 'Visiteur');
    const msgText = message.trim();
    setMessage('');

    // Ajout instantané dans le chat local
    setChatMessages(prev => [...prev, {
      user: senderName,
      text: msgText,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isHost: !!(user && isHost),
    }]);

    try {
      await sendLiveChatMessage(live.id, senderName, msgText, !!(user && isHost));
    } catch (err) {
      console.error('sendMessage error:', err);
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
    <div className="h-dvh bg-luxury-black relative overflow-hidden">
      <audio ref={audioRef} autoPlay playsInline />

      <div className="absolute inset-0 bg-luxury-dark">
        {isHost ? (
          <>
            <video ref={localVideoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover ${cameraStarted && isCameraOn ? '' : 'hidden'}`} />
            {(!cameraStarted || !isCameraOn) && (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <div className="text-center">
                  {!cameraStarted ? (
                    <>
                      <Camera size={48} className="text-gold/40 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm mb-4">Prêt à diffuser ?</p>
                      <button onClick={startCamera} disabled={startingCamera} className="px-8 py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center gap-2 mx-auto">
                        {startingCamera ? <><Loader size={16} className="animate-spin" /> Caméra...</> : <><Video size={16} /> Démarrer la caméra</>}
                      </button>
                      {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
                    </>
                  ) : (
                    <>
                      <Camera size={40} className="text-gold/50 mx-auto mb-2" />
                      <p className="text-gray-500">Caméra désactivée</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <video ref={hostVideoRef} autoPlay playsInline className={`absolute inset-0 w-full h-full object-cover ${hasRemoteVideo ? '' : 'hidden'}`} />
            {!hasRemoteVideo && (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                    <Radio size={36} className="text-gold" />
                  </div>
                  <p className="text-gold font-playfair text-lg">En direct</p>
                  <p className="text-gray-500 text-xs mt-1">{live.hostName}</p>
                  {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10 pointer-events-none">
        <button onClick={() => navigate('/live')} className="pointer-events-auto flex items-center gap-2 text-white/80 hover:text-white text-xs uppercase tracking-widest transition-all">
          <ArrowLeft size={16} /> Quitter
        </button>
        <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-sm shadow-lg">
          <span className="w-2 h-2 bg-white rounded-full animate-ping" />
          <span className="text-white text-[10px] font-black">LIVE</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
          <Users size={12} className="text-gold" />
          <span className="text-white text-xs font-bold">{live.viewerCount}</span>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 p-4 z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-xs font-bold shrink-0">
            {live.hostName.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm truncate">{live.title}</h1>
            <p className="text-gold/60 text-[10px]">{live.hostName} • {live.category}</p>
          </div>
        </div>
        {live.description && <p className="text-gray-500 text-xs mb-4 line-clamp-2">{live.description}</p>}

        <div className="flex items-center gap-3">
          {isHost && (
            <>
              {cameraStarted && (
                <div className="flex gap-2">
                  <button onClick={toggleCamera} className={`p-3 rounded-full backdrop-blur-md border transition-all ${isCameraOn ? 'bg-white/10 border-white/20' : 'bg-red-600/80 border-red-400'} text-white`}>
                    {isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
                  </button>
                  {isCameraOn && (
                    <button onClick={flipCamera} className="p-3 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">
                      <RefreshCw size={16} />
                    </button>
                  )}
                  <button onClick={toggleMic} className={`p-3 rounded-full backdrop-blur-md border transition-all ${isMicOn ? 'bg-white/10 border-white/20' : 'bg-red-600/80 border-red-400'} text-white`}>
                    {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
                  </button>
                  <button onClick={toggleScreenShare} className={`p-3 rounded-full backdrop-blur-md border transition-all ${isScreenSharing ? 'bg-gold text-black' : 'bg-white/10 border-white/20 text-white'}`}>
                    <ScreenShare size={16} />
                  </button>
                </div>
              )}
              <button onClick={() => setConfirmEnd(true)} className={`px-4 py-3 font-bold text-[10px] rounded-full uppercase tracking-widest transition-all whitespace-nowrap ${cameraStarted ? 'bg-white/90 text-black hover:bg-red-500 hover:text-white' : 'bg-red-600/80 text-white border border-red-400'}`}>
                Terminer
              </button>
            </>
          )}
          <button onClick={() => setShowChat(true)} className="ml-auto p-3 bg-gold text-black rounded-full shadow-lg">
            <MessageCircle size={18} />
          </button>
          {!isHost && (
            <button onClick={() => { setAudioEnabled(!audioEnabled); if (audioRef.current) audioRef.current.muted = audioEnabled; }} className="p-3 bg-white/10 border border-white/20 text-white rounded-full shadow-lg">
              {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !endingLive && setConfirmEnd(false)} />
          <div className="relative bg-luxury-dark border border-red-500/30 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl text-center">
            <p className="text-white font-bold text-lg mb-2">Terminer le live ?</p>
            <p className="text-gray-400 text-sm mb-6">Le direct sera arrêté pour tous les spectateurs.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEnd(false)}
                disabled={endingLive}
                className="flex-1 py-3 bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white/20 transition-all disabled:opacity-30"
              >
                Annuler
              </button>
              <button
                onClick={handleStopLive}
                disabled={endingLive}
                className="flex-1 py-3 bg-red-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {endingLive ? <><Loader size={16} className="animate-spin" /> Arrêt...</> : 'Terminer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowChat(false)} />
          <div className="relative w-full max-w-sm bg-luxury-dark border border-gold/20 flex flex-col shadow-2xl md:rounded-xl md:max-h-[80vh] h-[85dvh] md:h-auto">
            <div className="p-4 bg-luxury-light border-b border-gold/10 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
                <span className="text-white font-bold text-xs uppercase tracking-widest">Chat</span>
                <span className="text-gray-500 text-[10px]">{chatMessages.length} messages</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setChatTab('messages')} className={`flex-1 text-[10px] font-bold uppercase tracking-widest py-2 rounded-sm transition-all ${chatTab === 'messages' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'}`}>
                  Messages
                </button>
                <button onClick={() => setChatTab('participants')} className={`flex-1 text-[10px] font-bold uppercase tracking-widest py-2 rounded-sm transition-all ${chatTab === 'participants' ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'}`}>
                  Participants ({participants.length})
                </button>
              </div>
            </div>

            {chatTab === 'messages' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 text-sm italic">Soyez le premier à écrire !</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${user && msg.user === user.user_metadata?.full_name ? 'items-end' : 'items-start'}`}>
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
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {participants.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 text-sm italic">Aucun participant</p>
                  </div>
                )}
                {participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 bg-luxury-light/50 rounded-sm">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${p.isHost ? 'bg-gold/20 border border-gold/30 text-gold' : 'bg-white/10 text-gray-400'}`}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[9px] text-gray-600">{p.isHost ? 'Hôte' : 'Spectateur'}</p>
                    </div>
                    {p.isHost && <span className="ml-auto text-[9px] text-gold font-bold uppercase tracking-widest">Host</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-luxury-light/50 border-t border-gold/10 shrink-0">
              <div className="flex gap-2 bg-black/40 p-1 rounded-full border border-gold/10">
                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder="Écrivez un message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 bg-transparent text-white text-sm outline-none min-w-0"
                />
                <button onClick={handleSendMessage} className="p-2.5 bg-gold text-black rounded-full hover:scale-105 transition-transform shrink-0">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
