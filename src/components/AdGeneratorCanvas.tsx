import { useState, useRef, useEffect } from 'react';
import { RefreshCw, Upload, Trash2, Play, Square, Mic, Music, Film, Download, Volume2, VolumeX, Share2 } from 'lucide-react';
import meSpeak from 'mespeak';
import mespeakConfig from 'mespeak/src/mespeak_config.json';
import frVoice from 'mespeak/voices/fr.json';
import { useAuth } from '../contexts/AuthContext';
import { webmToMp4 } from '../lib/convertToMp4';

type AdFormat = 'hero' | 'popup' | 'square' | 'landscape';
type AdTemplate = 'luxury' | 'modern' | 'sale' | 'social';

const FORMATS: Record<AdFormat, { width: number; height: number; label: string }> = {
  hero: { width: 1400, height: 600, label: 'Hero' },
  popup: { width: 600, height: 800, label: 'Popup' },
  square: { width: 1080, height: 1080, label: 'Carré' },
  landscape: { width: 1200, height: 630, label: 'Paysage' },
};

const TEMPLATES = [
  { id: 'luxury' as const, label: 'Luxe', desc: 'Sombre & doré' },
  { id: 'modern' as const, label: 'Moderne', desc: 'Lignes épurées' },
  { id: 'sale' as const, label: 'Promo', desc: 'Badge -X%' },
  { id: 'social' as const, label: 'Social', desc: 'Pour réseaux' },
];

const GOLD = '#d4af37'; const GOLD_LIGHT = '#e6c85a'; const DARK = '#121218'; const BLACK = '#0a0a0a'; const WHITE = '#ffffff';

interface ImageFile { id: string; file: File; dataUrl: string; }

export default function AdGeneratorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const musicRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [images, setImages] = useState<ImageFile[]>([]);
  const [format, setFormat] = useState<AdFormat>('hero');
  const [template, setTemplate] = useState<AdTemplate>('luxury');
  const [brand, setBrand] = useState('LDBusiness');
  const [tagline, setTagline] = useState("L'Élégance Africaine");
  const [secPerImg, setSecPerImg] = useState(3);
  const [voiceText, setVoiceText] = useState('');
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState('');
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState('');
  const [musicVolume, setMusicVolume] = useState(25);
  const [voiceVolume, setVoiceVolume] = useState(100);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);

  const recRef = useRef<MediaRecorder | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const recordedAudioRef = useRef<HTMLAudioElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement>(null);

  const fmt = FORMATS[format];

  const addImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files.map(f => ({ id: Math.random().toString(36).slice(2), file: f, dataUrl: URL.createObjectURL(f) }))]);
  };

  const pickMusic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setMusicFile(f); if (musicUrl) URL.revokeObjectURL(musicUrl); setMusicUrl(URL.createObjectURL(f)); }
  };

  const startMic = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      micRef.current = s;
      const chunks: BlobPart[] = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') ? 'audio/ogg;codecs=opus'
        : '';
      const r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
      r.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      r.onstop = () => {
        const b = new Blob(chunks, { type: mime || 'audio/webm' });
        setRecordedBlob(b);
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(URL.createObjectURL(b));
        s.getTracks().forEach(t => t.stop());
      };
      recRef.current = r; r.start(); setIsRecording(true);
    } catch { alert('Autorisez le micro'); }
  };

  const wordsRef = useRef<string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(-1);

  const drawScene = (ctx: CanvasRenderingContext2D, w: number, h: number, img: HTMLImageElement, subtitle?: string, highlightIdx?: number) => {
    ctx.clearRect(0, 0, w, h);
    const fn = template === 'modern' ? drawModern : template === 'sale' ? drawSale : template === 'social' ? drawSocial : drawLuxury;
    fn(ctx, w, h, img, brand, tagline);
    if (subtitle) {
      const pad = Math.max(w * 0.04, 15);
      const fontSize = Math.max(Math.min(w * 0.028, h * 0.04), 14);
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'center';
      ctx.font = `bold ${fontSize}px sans-serif`;
      const maxW = w - pad * 2;
      const words = subtitle.split(' ');
      const lines: { text: string; wordIdxs: number[] }[] = [];
      let currentLine = '';
      let currentIdxs: number[] = [];
      let wordIdx = 0;
      for (const wd of words) {
        const test = currentLine ? currentLine + ' ' + wd : wd;
        if (ctx.measureText(test).width > maxW && currentLine) {
          lines.push({ text: currentLine, wordIdxs: [...currentIdxs] });
          currentLine = wd; currentIdxs = [wordIdx];
        } else { currentLine = test; currentIdxs.push(wordIdx); }
        wordIdx++;
      }
      if (currentLine) lines.push({ text: currentLine, wordIdxs: [...currentIdxs] });

      const lineH = fontSize * 1.4;
      const boxH = lines.length * lineH + pad;
      const boxY = h - boxH - pad * 0.5;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.roundRect(pad, boxY, w - pad * 2, boxH, 8);
      ctx.fill();

      let ty = boxY + fontSize + pad * 0.4;
      for (const line of lines) {
        let x = w / 2 - ctx.measureText(line.text).width / 2;
        const words = line.text.split(' ');
        let wi = 0;
        for (const wd of words) {
          const globalIdx = line.wordIdxs[wi];
          const isHighlight = globalIdx === highlightIdx;
          ctx.fillStyle = isHighlight ? GOLD : WHITE;
          ctx.font = isHighlight ? `bold ${fontSize * 1.1}px sans-serif` : `bold ${fontSize}px sans-serif`;
          ctx.fillText(wd, x + ctx.measureText(wd).width / 2, ty);
          const ww = ctx.measureText(wd).width;
          if (isHighlight) {
            ctx.fillStyle = GOLD;
            ctx.fillRect(x, ty + 2, ww, 2);
          }
          x += ww + ctx.measureText(' ').width;
          wi++;
        }
        ty += lineH;
      }
    }
  };

  const speakWithHighlight = () => {
    if (!voiceText.trim()) return;
    if (isSpeaking) { speechSynthesis.cancel(); setIsSpeaking(false); setCurrentWordIdx(-1); return; }
    const words = voiceText.split(/\s+/);
    wordsRef.current = words;
    const u = new SpeechSynthesisUtterance(voiceText);
    u.lang = 'fr-FR'; u.rate = 0.9;
    u.onboundary = (e) => {
      if (e.name === 'word') {
        const charIdx = e.charIndex;
        let idx = 0, pos = 0;
        for (const w of words) { if (pos === charIdx) { setCurrentWordIdx(idx); break; } pos += w.length + 1; idx++; }
      }
    };
    u.onend = () => { setIsSpeaking(false); setCurrentWordIdx(-1); };
    u.onerror = () => { setIsSpeaking(false); setCurrentWordIdx(-1); };
    setIsSpeaking(true); speechSynthesis.speak(u);
  };

  const ttsReady = useRef(false);
  useEffect(() => {
    if (!ttsReady.current) {
      meSpeak.loadConfig(mespeakConfig);
      meSpeak.loadVoice(frVoice);
      ttsReady.current = true;
    }
  }, []);

  const ttsCache = useRef<Record<string, string>>({});

  const generateTtsBlob = async (text: string): Promise<string> => {
    if (ttsCache.current[text]) return ttsCache.current[text];
    const maxLen = 180;
    const chunk = text.length > maxLen ? text.slice(0, text.lastIndexOf(' ', maxLen)) + '...' : text;
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(chunk)}&tl=fr`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const blob = await resp.blob();
      const dataUrl = URL.createObjectURL(blob);
      ttsCache.current[text] = dataUrl;
      return dataUrl;
    } catch {
      const dataUrl = meSpeak.speak(chunk, {
        rawdata: 'data-url', voice: 'fr', variant: 'f2',
        speed: 130, pitch: 50, amplitude: 140,
      });
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
        ttsCache.current[text] = dataUrl;
        return dataUrl;
      }
      throw new Error('TTS indisponible');
    }
  };

  const [previewImages, setPreviewImages] = useState<HTMLImageElement[]>([]);
  useEffect(() => {
    if (!canvasRef.current || previewImages.length === 0) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const fmt = FORMATS[format]; canvas.width = fmt.width; canvas.height = fmt.height;
    drawScene(ctx, fmt.width, fmt.height, previewImages[0], voiceText || undefined, currentWordIdx);
  }, [currentWordIdx, format, template, brand, tagline, previewImages, voiceText]);

  const preloadPreviewImages = () => {
    Promise.all(images.map(img => new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = img.dataUrl;
    }))).then(setPreviewImages);
  };

  useEffect(() => { preloadPreviewImages(); }, [images]);

  useEffect(() => { if (recordedAudioRef.current) recordedAudioRef.current.volume = voiceVolume / 100; }, [voiceVolume]);
  useEffect(() => { if (musicAudioRef.current) musicAudioRef.current.volume = musicVolume / 100; }, [musicVolume]);

  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const r = await fetch(`/api/tiktok/status?userId=${user.id}`);
        const d = await r.json();
        setTiktokConnected(d.connected);
        setTiktokUsername(d.username || '');
      } catch {}
    })();
  }, [user]);

  const publishToTikTok = async () => {
    if (!videoUrl || !user) return;
    setPublishing(true); setPublishStatus('Conversion MP4...');
    try {
      const blobResp = await fetch(videoUrl);
      const webmBlob = await blobResp.blob();
      if (webmBlob.size === 0) { setPublishStatus('Vidéo vide'); setPublishing(false); return; }

      const mp4Blob = await webmToMp4(webmBlob);

      setPublishStatus('Initialisation upload TikTok...');
      const initR = await fetch('/tiktok/init-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, fileSize: mp4Blob.size, description: voiceText, title: brand + ' - ' + tagline }),
      });
      const initD = await initR.json();
      if (!initD.upload_url) { setPublishStatus('Erreur init: ' + JSON.stringify(initD)); setPublishing(false); return; }

      setPublishStatus('Upload vidéo vers TikTok...');
      const uploadR = await fetch(initD.upload_url, { method: 'PUT', body: mp4Blob, mode: 'cors' });
      if (!uploadR.ok) { setPublishStatus('Erreur upload: ' + uploadR.status); setPublishing(false); return; }

      setPublishStatus('Publication...');
      const pubR = await fetch('/tiktok/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, video_id: initD.video_id, description: voiceText, title: brand + ' - ' + tagline }),
      });
      const pubD = await pubR.json();
      if (pubD.success) { setPublishStatus('Publié sur TikTok ✓'); }
      else { setPublishStatus('Erreur: ' + (pubD.error || JSON.stringify(pubD))); }
    } catch (e: any) { setPublishStatus('Erreur: ' + (e.message || 'réseau')); }
    setPublishing(false);
  };

  const generate = async () => {
    if (images.length === 0 || !canvasRef.current) return;
    setVideoError('');
    if (videoUrl) { URL.revokeObjectURL(videoUrl); setVideoUrl(null); }
    if (timerRef.current !== null) { clearTimeout(timerRef.current); timerRef.current = null; }

    const canvas = canvasRef.current;
    const w = fmt.width, h = fmt.height;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setVideoError('Contexte 2D indisponible'); return; }

    if (typeof MediaRecorder === 'undefined') { setVideoError('MediaRecorder non supporté'); return; }
    if (typeof (canvas as any).captureStream !== 'function') { setVideoError('captureStream non supporté'); return; }

    const fps = 10;
    const spi = Math.max(secPerImg, 1);
    const frameMs = 1000 / fps;

    setExporting(true);
    setProgress('Préparation...');

    try {
      const preloaded = await Promise.all(images.map(img => new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = img.dataUrl;
      })));

      drawScene(ctx, w, h, preloaded[0], voiceText || undefined);
      const videoStream = canvas.captureStream(fps);
      const vt = videoStream.getVideoTracks()[0];
      if (!vt) { setVideoError('Pas de piste vidéo'); return; }

      const chunks: BlobPart[] = [];
      const audioEls: HTMLAudioElement[] = [];

      let silentCtx: AudioContext | null = null;
      let audioOk = false;
      try {
        let voiceUrl = recordedUrl;
        if (!voiceUrl && voiceText.trim()) {
          setProgress('Génération voix off...');
          voiceUrl = await generateTtsBlob(voiceText);
        }
        if (voiceUrl) {
          setProgress('Voix off...');
          const el = new Audio(voiceUrl);
          el.style.display = 'none';
          document.body.appendChild(el);
          audioEls.push(el);
          el.load();
          await new Promise<void>((res, rej) => { el.oncanplaythrough = () => res(); el.onerror = rej; setTimeout(rej, 5000); });
          el.muted = false;
          await el.play();
          await new Promise(r => setTimeout(r, 300));
          if ((el as any).captureStream) {
            const s = (el as any).captureStream();
            for (const t of s.getAudioTracks()) { t.enabled = true; videoStream.addTrack(t); audioOk = true; }
          }
        }
        if (musicUrl) {
          setProgress('Musique...');
          const el = new Audio(musicUrl); el.loop = true;
          el.style.display = 'none';
          document.body.appendChild(el);
          audioEls.push(el);
          el.load();
          await new Promise<void>((res, rej) => { el.oncanplaythrough = () => res(); el.onerror = rej; setTimeout(rej, 5000); });
          await el.play();
          await new Promise(r => setTimeout(r, 300));
          if ((el as any).captureStream) {
            const s = (el as any).captureStream();
            for (const t of s.getAudioTracks()) { t.enabled = true; videoStream.addTrack(t); audioOk = true; }
          }
        }
        if (!audioOk) {
          silentCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          await silentCtx.resume();
          const osc = silentCtx.createOscillator(); osc.frequency.value = 0;
          const g = silentCtx.createGain(); g.gain.value = 0;
          const dest = silentCtx.createMediaStreamDestination();
          osc.connect(g); g.connect(dest); osc.start();
          for (const t of dest.stream.getAudioTracks()) videoStream.addTrack(t);
        }
      } catch (e: any) {
        setVideoError('Erreur audio: ' + (e?.message || 'vérifie le format audio')); setExporting(false);
        audioEls.forEach(el => el.remove());
        if (silentCtx) silentCtx.close();
        return;
      }

      const mimeType = ['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,vorbis','video/webm',''].find(m => !m || MediaRecorder.isTypeSupported(m)) || '';
      const rec = new MediaRecorder(videoStream, mimeType ? { mimeType, audioBitsPerSecond: 128000 } : { audioBitsPerSecond: 128000 });

      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      const stopRec = () => {
        try { rec.stop(); } catch {}
        if (timerRef.current !== null) { clearTimeout(timerRef.current); timerRef.current = null; }
      };

      rec.onstop = () => {
        audioEls.forEach(el => el.remove());
        if (silentCtx) silentCtx.close();
        const b = new Blob(chunks, { type: 'video/webm' });
        if (b.size === 0) { setVideoError('Fichier vide — codec non supporté'); setExporting(false); return; }
        setVideoUrl(URL.createObjectURL(b));
        setExporting(false); setProgress('');
      };
      rec.onerror = () => { setVideoError('Erreur encodage'); stopRec(); audioEls.forEach(el => el.remove()); if (silentCtx) silentCtx.close(); setExporting(false); };

      rec.start(500);
      const t0 = performance.now();
      let prevImgIdx = -1;
      let stopped = false;

      const totalDur = images.length * spi;
      const words = voiceText ? voiceText.split(/\s+/) : [];
      const wordDur = words.length > 0 ? totalDur / words.length : Infinity;

      const tick = () => {
        if (stopped) return;
        try {
          const elapsed = (performance.now() - t0) / 1000;
          if (elapsed >= totalDur + 0.5) { stopped = true; stopRec(); return; }
          const idx = Math.min(Math.floor(elapsed / spi), preloaded.length - 1);
          const hIdx = wordDur < Infinity ? Math.min(Math.floor(elapsed / wordDur), words.length - 1) : undefined;
          drawScene(ctx, w, h, preloaded[idx], voiceText || undefined, hIdx);
          if (idx !== prevImgIdx) { prevImgIdx = idx; setProgress(`Image ${idx + 1}/${preloaded.length}`); }
        } catch (e: any) { setVideoError('Erreur: ' + (e?.message || 'inconnue')); stopped = true; stopRec(); setExporting(false); return; }
        timerRef.current = window.setTimeout(tick, frameMs);
      };

      tick();
      setTimeout(() => { if (!stopped && !videoUrl) { setVideoError('Délai dépassé'); stopRec(); setExporting(false); } }, (totalDur + 8) * 1000);

    } catch (err: any) {
      setVideoError(err?.message || 'Erreur inconnue');
      setExporting(false);
    }
  };

  const reset = () => {
    if (videoUrl) { URL.revokeObjectURL(videoUrl); setVideoUrl(null); }
    setVideoError('');
  };

  return (
    <div className="bg-luxury-dark border border-gold/10 rounded-xl p-4 md:p-6">
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={addImages} className="hidden" />
      <input ref={musicRef} type="file" accept="audio/*" onChange={pickMusic} className="hidden" />

      {videoError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
          <p className="text-red-400 text-xs font-bold">{videoError}</p>
        </div>
      )}

      {videoUrl ? (
        <div className="space-y-3">
          <video ref={videoRef} src={videoUrl} controls className="w-full max-h-[70vh] rounded-lg border border-gold/10 bg-black" />
          <div className="flex gap-2">
            <a href={videoUrl} download={`pub_${template}_${format}.webm`}
              className="flex-1 py-3 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all flex items-center justify-center gap-2">
              <Download size={16} /> Télécharger
            </a>
            {tiktokConnected && (
              <button onClick={publishToTikTok} disabled={publishing}
                className="py-3 px-4 border border-gold/30 text-gold text-xs uppercase tracking-widest rounded-sm hover:bg-gold/10 transition-all disabled:opacity-30 flex items-center gap-1.5">
                <Share2 size={14} /> {publishing ? '...' : 'TikTok'}
              </button>
            )}
            <button onClick={reset}
              className="py-3 px-6 border border-gold/30 text-gold text-xs uppercase tracking-widest rounded-sm hover:bg-gold/10 transition-all">
              Refaire
            </button>
          </div>
          {publishStatus && (
            <div className={`text-center text-xs font-bold ${publishStatus.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {publishStatus}
            </div>
          )}
        </div>
      ) : exporting ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 bg-black border border-gold/20 rounded-lg">
          <RefreshCw size={32} className="text-gold animate-spin" />
          <span className="text-gold text-sm font-bold">Génération... {progress}</span>
        </div>
      ) : (
        <div className="space-y-4">
          <canvas ref={canvasRef} className="w-full max-h-[65vh] rounded-lg border border-gold/10 bg-black object-contain" style={{ aspectRatio: `${fmt.width}/${fmt.height}` }} />
          <button onClick={generate} disabled={images.length === 0}
            className="w-full py-4 bg-gold text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center justify-center gap-3">
            <Film size={20} /> Générer la vidéo ({images.length} image{images.length > 1 ? 's' : ''})
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-black border border-gold/10 rounded-lg p-4 space-y-3">
          <h3 className="text-gold text-xs font-bold uppercase tracking-widest">Audio & Sous-titres</h3>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Texte lu dans la vidéo</label>
            <div className="flex gap-2">
              <textarea value={voiceText} onChange={e => setVoiceText(e.target.value)}
                placeholder="Texte de la voix off..."
                rows={2} className="flex-1 px-3 py-2 bg-luxury-dark border border-gold/10 rounded-sm text-white text-xs focus:border-gold outline-none resize-none" />
              <button onClick={speakWithHighlight}
                className={`px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shrink-0 ${isSpeaking ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20'}`}>
                {isSpeaking ? <Square size={12} /> : <Play size={12} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={isRecording ? () => { recRef.current?.stop(); setIsRecording(false); } : startMic}
              className={`py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 ${isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-black border border-gold/10 text-gray-400 hover:border-gold/30'}`}>
              <Mic size={12} /> {isRecording ? 'Arrêter' : recordedBlob ? 'Micro ✓' : 'Micro'}
            </button>
            <button onClick={() => musicRef.current?.click()}
              className={`py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 ${musicFile ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-black border border-gold/10 text-gray-400 hover:border-gold/30'}`}>
              <Music size={12} /> {musicFile ? 'Musique ✓' : 'Musique'}
            </button>
          </div>
          {voiceText.trim() && !recordedBlob && (
            <p className="text-[9px] text-gray-500 italic pt-1">
              Pas d'enregistrement ? La voix synthétique sera utilisée
            </p>
          )}
          {(recordedBlob || musicFile) && (
            <div className="space-y-2 pt-1">
              {recordedBlob && (
                <div>
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest">Volume voix</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setVoiceMuted(!voiceMuted); if (recordedAudioRef.current) recordedAudioRef.current.muted = !voiceMuted; }} className="text-gray-400 hover:text-white shrink-0">
                      {voiceMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    <input type="range" min="0" max="100" value={voiceVolume} onChange={e => { const v = Number(e.target.value); setVoiceVolume(v); if (recordedAudioRef.current) { recordedAudioRef.current.volume = v / 100; recordedAudioRef.current.muted = false; setVoiceMuted(false); } }} className="flex-1 accent-gold h-1" />
                    <span className="text-gold text-[10px] font-bold w-6 text-right">{voiceVolume}%</span>
                  </div>
                  <audio ref={recordedAudioRef} src={recordedUrl!} controls className="w-full h-7 mt-1" />
                </div>
              )}
              {musicFile && (
                <div>
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest">Volume musique</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setMusicMuted(!musicMuted); if (musicAudioRef.current) musicAudioRef.current.muted = !musicMuted; }} className="text-gray-400 hover:text-white shrink-0">
                      {musicMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    <input type="range" min="0" max="100" value={musicVolume} onChange={e => { const v = Number(e.target.value); setMusicVolume(v); if (musicAudioRef.current) { musicAudioRef.current.volume = v / 100; musicAudioRef.current.muted = false; setMusicMuted(false); } }} className="flex-1 accent-gold h-1" />
                    <span className="text-gold text-[10px] font-bold w-6 text-right">{musicVolume}%</span>
                  </div>
                  <audio ref={musicAudioRef} src={musicUrl!} controls className="w-full h-7 mt-1" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-black border border-gold/10 rounded-lg p-4 space-y-3">
          <h3 className="text-gold text-xs font-bold uppercase tracking-widest">Images ({images.length})</h3>
          {images.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {images.map(img => (
                <div key={img.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-luxury-dark border border-gold/5 rounded-sm text-xs">
                  <img src={img.dataUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                  <span className="text-gray-400 truncate flex-1">{img.file.name}</span>
                  <button onClick={() => setImages(prev => prev.filter(x => x.id !== img.id))} className="text-gray-600 hover:text-red-400 shrink-0"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="w-full py-6 bg-luxury-dark border border-dashed border-gold/20 rounded-sm text-gold/40 text-xs hover:border-gold/50 flex flex-col items-center gap-2">
              <Upload size={20} /><span>Ajouter des images</span>
            </button>
          )}
          <button onClick={() => fileRef.current?.click()} className="w-full py-2 bg-luxury-dark border border-dashed border-gold/10 rounded-sm text-gold/40 text-[10px] hover:border-gold/30">+ Ajouter</button>
        </div>

        <div className="space-y-3">
          <div className="bg-black border border-gold/10 rounded-lg p-4">
            <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-2">Marque</label>
            <input type="text" value={brand} onChange={e => setBrand(e.target.value)} className="w-full px-3 py-2.5 bg-luxury-dark border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm" />
          </div>
          <div className="bg-black border border-gold/10 rounded-lg p-4">
            <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-2">Tagline</label>
            <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} className="w-full px-3 py-2.5 bg-luxury-dark border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm" />
          </div>
          <div className="bg-black border border-gold/10 rounded-lg p-4">
            <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-2">Durée par image</label>
            <div className="flex items-center gap-3">
              <input type="range" min="1" max="10" value={secPerImg} onChange={e => setSecPerImg(Number(e.target.value))} className="flex-1 accent-gold" />
              <span className="text-gold text-sm font-bold w-8 text-right">{secPerImg}s</span>
            </div>
            <p className="text-gray-600 text-[10px] mt-1">Total ~{images.length * secPerImg}s</p>
          </div>
          <div className="bg-black border border-gold/10 rounded-lg p-4">
            <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-2">Template</label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  className={`px-3 py-2.5 rounded-sm text-xs text-left transition-all ${template === t.id ? 'bg-gold text-black font-bold' : 'bg-luxury-dark border border-gold/10 text-gray-400 hover:border-gold/30'}`}>
                  <div className="font-bold">{t.label}</div>
                  <div className="text-[9px] opacity-70">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-black border border-gold/10 rounded-lg p-4">
            <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-2">Format</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(FORMATS) as [AdFormat, typeof FORMATS[AdFormat]][]).map(([key, f]) => (
                <button key={key} onClick={() => setFormat(key)}
                  className={`px-3 py-2.5 rounded-sm text-xs text-left transition-all ${format === key ? 'bg-gold text-black font-bold' : 'bg-luxury-dark border border-gold/10 text-gray-400 hover:border-gold/30'}`}>
                  <div className="font-bold">{f.label}</div>
                  <div className="text-[9px] opacity-70">{f.width}x{f.height}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {user && (
        <div className="mt-4 bg-black border border-gold/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">TikTok</label>
              {tiktokConnected ? (
                <p className="text-green-400 text-xs">Connecté en tant que {tiktokUsername}</p>
              ) : (
                <p className="text-gray-500 text-xs">Connecte ton compte pour publier directement</p>
              )}
            </div>
            <a href={`/api/tiktok/auth?userId=${user.id}`}
              className={`py-2 px-4 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${tiktokConnected ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-black border border-gold/10 text-gray-400 hover:border-gold/30'}`}>
              <Share2 size={12} /> {tiktokConnected ? 'Reconnecter' : 'Connecter TikTok'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}


function drawLuxury(ctx: CanvasRenderingContext2D, w: number, h: number, img: HTMLImageElement, name: string, tagline: string) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, BLACK); g.addColorStop(0.5, DARK); g.addColorStop(1, BLACK);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  drawProductImage(ctx, w, h, img, 'right');
  const o = ctx.createLinearGradient(0, 0, 0, h);
  o.addColorStop(0, 'rgba(0,0,0,0.75)'); o.addColorStop(0.6, 'rgba(0,0,0,0.3)'); o.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = o; ctx.fillRect(0, 0, w, h);
  const m = Math.max(w*0.06, 20); let y = h*0.1;
  ctx.fillStyle = GOLD; ctx.font = `bold ${h*0.035}px sans-serif`; ctx.textBaseline = 'top';
  ctx.fillText(name, m, y); y += h*0.055;
  ctx.fillStyle = WHITE; ctx.font = `bold ${h*0.05}px sans-serif`;
  ctx.fillText("Nouvelle Collection", m, y); y += h*0.07;
  ctx.fillStyle = GOLD_LIGHT; ctx.font = `bold ${h*0.045}px sans-serif`;
  ctx.fillText("Découvrez maintenant", m, y);
  ctx.fillStyle = 'rgba(212,175,55,0.6)'; ctx.font = `${h*0.022}px sans-serif`;
  const tw = ctx.measureText(tagline).width;
  ctx.fillText(tagline, w - m - tw, h*0.05);
}

function drawModern(ctx: CanvasRenderingContext2D, w: number, h: number, img: HTMLImageElement, name: string, tagline: string) {
  ctx.fillStyle = DARK; ctx.fillRect(0, 0, w, h);
  const a = Math.max(h*0.04, 10); ctx.fillStyle = GOLD;
  ctx.fillRect(0, 0, w, a); ctx.fillRect(0, h - a, w, a);
  drawProductImage(ctx, w, h, img, 'right');
  const o = ctx.createLinearGradient(0, 0, 0, h);
  o.addColorStop(0, 'rgba(0,0,0,0.6)'); o.addColorStop(0.5, 'rgba(0,0,0,0.3)'); o.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = o; ctx.fillRect(0, 0, w, h);
  const m = Math.max(w*0.06, 20); let y = h*0.12;
  ctx.fillStyle = GOLD; ctx.font = `bold ${h*0.028}px sans-serif`; ctx.textBaseline = 'top';
  ctx.fillText(name.toUpperCase(), m, y); y += h*0.05;
  ctx.fillStyle = WHITE; ctx.font = `bold ${h*0.05}px sans-serif`;
  ctx.fillText("Nouvelle Collection", m, y); y += h*0.07;
  ctx.fillStyle = GOLD_LIGHT; ctx.font = `bold ${h*0.04}px sans-serif`;
  ctx.fillText(tagline, m, y);
}

function drawSale(ctx: CanvasRenderingContext2D, w: number, h: number, img: HTMLImageElement, name: string, tagline: string) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#1a0f0a'); g.addColorStop(0.5, '#2d1a0e'); g.addColorStop(1, '#1a0f0a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  drawProductImage(ctx, w, h, img, 'right');
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, w, h);
  const m = Math.max(w*0.06, 20); let y = h*0.08;
  ctx.fillStyle = GOLD; ctx.font = `bold ${h*0.055}px sans-serif`; ctx.textBaseline = 'top';
  ctx.fillText('SALE', m, y); y += h*0.08;
  ctx.fillStyle = '#ff3333'; ctx.font = `bold ${h*0.08}px sans-serif`; ctx.fillText('-15%', m, y); y += h*0.11;
  ctx.fillStyle = WHITE; ctx.font = `bold ${h*0.028}px sans-serif`; ctx.fillText(name, m, y); y += h*0.045;
  y += h*0.02; ctx.fillStyle = GOLD_LIGHT; ctx.font = `bold ${h*0.04}px sans-serif`;
  ctx.fillText("Offre limitée", m, y); y += h*0.055;
  ctx.fillStyle = 'rgba(200,200,200,0.7)'; ctx.font = `${h*0.022}px sans-serif`; ctx.fillText(tagline, m, y);
}

function drawSocial(ctx: CanvasRenderingContext2D, w: number, h: number, img: HTMLImageElement, name: string, tagline: string) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0a0a1a'); g.addColorStop(0.5, '#141428'); g.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  drawProductImage(ctx, w, h, img, 'center');
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, w, h);
  const ly = h*0.55; ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w*0.06, ly); ctx.lineTo(w*0.46, ly); ctx.stroke();
  const m = Math.max(w*0.08, 25); let y = ly + 20;
  ctx.fillStyle = WHITE; ctx.font = `bold ${h*0.045}px sans-serif`; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText(name.toUpperCase(), m, y); y += h*0.06;
  ctx.fillStyle = GOLD; ctx.font = `bold ${h*0.035}px sans-serif`; ctx.fillText(tagline, m, y);
}

function drawProductImage(ctx: CanvasRenderingContext2D, w: number, h: number, img: HTMLImageElement, pos: 'right' | 'center' | 'left') {
  if (!img.complete || img.naturalWidth === 0) return;
  const size = Math.max(w*0.55, h*0.55);
  const scale = size / Math.max(img.width, img.height);
  const iw = img.width * scale, ih = img.height * scale;
  ctx.save(); ctx.beginPath();
  if (pos === 'center') {
    ctx.arc(w/2, h/2, size/2, 0, Math.PI*2); ctx.clip();
    ctx.drawImage(img, (w-iw)/2, (h-ih)/2, iw, ih);
  } else {
    const x = pos === 'right' ? w - iw + iw*0.15 : -iw*0.15;
    ctx.ellipse(pos === 'right' ? w - size/2 + size*0.1 : size/2 - size*0.1, h/2, size/2, size/2, 0, 0, Math.PI*2);
    ctx.clip(); ctx.drawImage(img, x, (h-ih)/2, iw, ih);
  }
  ctx.restore();
}
