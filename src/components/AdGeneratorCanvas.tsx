import { useState, useRef, useEffect } from 'react';
import { RefreshCw, Upload, Trash2, Play, Square, Mic, Music, Film, Download, Volume2, VolumeX, Sparkles, MessageCircle } from 'lucide-react';
import meSpeak from 'mespeak';
import mespeakConfig from 'mespeak/src/mespeak_config.json';
import frVoice from 'mespeak/voices/fr.json';
import enVoice from 'mespeak/voices/en/en.json';
import { useTranslation } from '../i18n';
import type { Language } from '../i18n/context';

type AdFormat = 'hero' | 'popup' | 'square' | 'landscape';
type AdTemplate = 'luxury' | 'modern' | 'sale' | 'social';
type HostType = 'mascot' | 'woman' | 'man' | 'none';

const FORMATS: Record<AdFormat, { width: number; height: number; labelKey: string }> = {
  hero: { width: 1400, height: 600, labelKey: 'adGenerator.hero' },
  popup: { width: 600, height: 800, labelKey: 'adGenerator.popup' },
  square: { width: 1080, height: 1080, labelKey: 'adGenerator.square' },
  landscape: { width: 1200, height: 630, labelKey: 'adGenerator.landscape' },
};

const TEMPLATES = [
  { id: 'luxury' as const, labelKey: 'adGenerator.luxe', descKey: 'adGenerator.luxeDesc' },
  { id: 'modern' as const, labelKey: 'adGenerator.modern', descKey: 'adGenerator.modernDesc' },
  { id: 'sale' as const, labelKey: 'adGenerator.promo', descKey: 'adGenerator.promoDesc' },
  { id: 'social' as const, labelKey: 'adGenerator.social', descKey: 'adGenerator.socialDesc' },
];

const GOLD = '#d4af37'; const GOLD_LIGHT = '#e6c85a'; const DARK = '#121218'; const BLACK = '#0a0a0a'; const WHITE = '#ffffff';

type MelodyStyle = 'soft' | 'elegant' | 'dynamic' | 'pop';

type Wave = 'sine' | 'triangle' | 'square';

const MELODY_STYLES: Record<MelodyStyle, {
  labelKey: string;
  bpm: number;
  base: number;
  chords: number[][];        // scale degrees as frequencies at octave 1
  padVol: number;
  noteVol: number;
  stepsPerBar: number;
  noteMul: number;           // pitch multiplier for the pluck melody
  wave: Wave;
}> = {
  soft: {
    labelKey: 'adGenerator.styleSoft', bpm: 70, base: 130.8 /* C3 */,
    chords: [
      [1, 1.25, 1.5],        // C  (root, major third, fifth)
      [0.944, 1.18, 1.5],    // A min-ish
      [0.833, 1.05, 1.25],   // F
      [0.75, 0.944, 1.25],   // G
    ],
    padVol: 0.3, noteVol: 0.18, stepsPerBar: 2, noteMul: 1, wave: 'sine',
  },
  elegant: {
    labelKey: 'adGenerator.styleElegant', bpm: 82, base: 174.6 /* F3 */,
    chords: [
      [1, 1.2, 1.5],         // F minor-ish
      [1.125, 1.5, 1.78],    // G#
      [0.944, 1.25, 1.5],    // D#
      [0.833, 1.125, 1.5],   // C#
    ],
    padVol: 0.26, noteVol: 0.14, stepsPerBar: 3, noteMul: 2, wave: 'triangle',
  },
  dynamic: {
    labelKey: 'adGenerator.styleDynamic', bpm: 128, base: 98.0 /* G2 */,
    chords: [
      [1, 1.189, 1.498],     // G minor power
      [1, 1.189, 1.498],
      [0.833, 1, 1.259],     // F
      [0.833, 1, 1.259],
    ],
    padVol: 0.14, noteVol: 0.22, stepsPerBar: 6, noteMul: 1, wave: 'square',
  },
  pop: {
    labelKey: 'adGenerator.stylePop', bpm: 118, base: 146.8 /* D3 */,
    chords: [
      [1, 1.259, 1.498],     // D major
      [0.833, 1.05, 1.259],  // Bm
      [0.667, 0.833, 1],     // A
      [0.75, 0.944, 1.189],  // G
    ],
    padVol: 0.2, noteVol: 0.2, stepsPerBar: 4, noteMul: 2, wave: 'triangle',
  },
};

const LANG_CONFIG: Record<Language, { tts: string; speak: string; meSpeakVoice: string; loadVoice: typeof frVoice | null }> = {
  fr: { tts: 'fr', speak: 'fr-FR', meSpeakVoice: 'fr', loadVoice: frVoice },
  en: { tts: 'en', speak: 'en-US', meSpeakVoice: 'en', loadVoice: enVoice },
  sw: { tts: 'sw', speak: 'sw', meSpeakVoice: '', loadVoice: null },
};

interface ImageFile { id: string; file: File; dataUrl: string; }

export default function AdGeneratorCanvas() {
  const { t, lang: activeLang } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const musicRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [images, setImages] = useState<ImageFile[]>([]);
  const [format, setFormat] = useState<AdFormat>('hero');
  const [template, setTemplate] = useState<AdTemplate>('luxury');
  const [brand, setBrand] = useState(t('adGenerator.defaultBrand'));
  const [tagline, setTagline] = useState(t('adGenerator.defaultTagline'));
  const [secPerImg, setSecPerImg] = useState(3);
  const [voiceText, setVoiceText] = useState('');
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [melodyActive, setMelodyActive] = useState(false);
  const [generatingMelody, setGeneratingMelody] = useState(false);
  const [melodyStyle, setMelodyStyle] = useState<MelodyStyle>('soft');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState('');
  const [musicVolume, setMusicVolume] = useState(15);
  const [voiceVolume, setVoiceVolume] = useState(100);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [productDesc, setProductDesc] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [storeLink, setStoreLink] = useState('');
  const [scriptStatus, setScriptStatus] = useState('');
  const [hostType, setHostType] = useState<HostType>('woman');

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
    if (f) { setMusicFile(f); if (musicUrl) URL.revokeObjectURL(musicUrl); setMusicUrl(URL.createObjectURL(f)); setMelodyActive(false); }
  };

const generateMelody = async () => {
    if (generatingMelody) return;
    setGeneratingMelody(true);
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const totalSec = images.length * Math.max(secPerImg, 1) + 4;
      const duration = Math.min(Math.max(totalSec, 5), 25);
      const ctx = new AudioCtx({ sampleRate: 22050 });
      const buffer = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);

      const style = MELODY_STYLES[melodyStyle];
      const chords = style.chords;
      const barLen = Math.floor(ctx.sampleRate * (4 * 60 / style.bpm)); // 4 beats per bar
      let out = 0;

      for (let c = 0; c < chords.length; c++) {
        const chord = chords[c];
        const barEnd = (c + 1) * barLen;
        // Pad (soft sustained chord, calm sine regardless of style)
        chord.forEach((m, j) => {
          const freq = style.base * m;
          padNote(buffer, out, barEnd, freq, style.padVol * (j / chord.length + 0.4));
          if (c > 0) padNote(buffer, out, barEnd, freq, style.padVol * (j / chord.length + 0.4), barLen);
        });
        // Melody arpeggio with distinctive timbre
        const pattern = chord.slice();
        for (let step = 0; step < style.stepsPerBar; step++) {
          const place = out + Math.floor(step * (barLen / style.stepsPerBar));
          const m = pattern[step % pattern.length];
          pluckNote(buffer, place, place + barLen / style.stepsPerBar, style.base * m * style.noteMul, style.noteVol, style.wave);
        }
        out = barEnd;
      }

      // Soft fade in/out
      const fade = Math.floor(ctx.sampleRate * 0.4);
      for (let ch = 0; ch < 2; ch++) {
        const d = buffer.getChannelData(ch);
        for (let i = 0; i < fade; i++) d[i] *= i / fade;
        for (let i = buffer.length - fade; i < buffer.length; i++) d[i] *= (buffer.length - i) / fade;
      }

      // Remaster to a normalized pleasant level
      let peak = 0;
      for (let ch = 0; ch < 2; ch++) {
        const d = buffer.getChannelData(ch);
        for (let i = 0; i < buffer.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; }
      }
      if (peak > 0.9) {
        const g = 0.9 / peak;
        for (let ch = 0; ch < 2; ch++) {
          const d = buffer.getChannelData(ch);
          for (let i = 0; i < buffer.length; i++) d[i] *= g;
        }
      }

      const blob = audioBufferToWav(buffer);
      ctx.close();
      const dataUrl = URL.createObjectURL(blob);
      if (musicUrl) URL.revokeObjectURL(musicUrl);
      setMusicUrl(dataUrl);
      setMusicFile(new File([blob], `melody_${melodyStyle}.wav`, { type: 'audio/wav' }));
      setMelodyActive(true);
    } catch {
      setVideoError(t('adGenerator.errorMusicGen'));
    }
    setGeneratingMelody(false);
  };

  function padNote(buf: AudioBuffer, from: number, to: number, freq: number, vol: number, offset = 0) {
    const sr = buf.sampleRate;
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = from + offset; i < to; i++) {
        const phase = (i - from) * freq / sr;
        d[i] += Math.sin(phase * 2 * Math.PI) * vol * (0.6 + Math.sin((i - from) * 0.0005) * 0.25);
      }
    }
  }
  function pluckNote(buf: AudioBuffer, from: number, to: number, freq: number, vol = 0.15, wave: Wave = 'sine') {
    const sr = buf.sampleRate;
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = from; i < to; i++) {
        const env = Math.pow(1 - (i - from) / (to - from), 2);
        const t = (i - from) * freq / sr * 2 * Math.PI;
        let v: number;
        if (wave === 'square') v = Math.sin(t) >= 0 ? 1 : -1;
        else if (wave === 'triangle') v = (2 / Math.PI) * Math.asin(Math.sin(t));
        else v = Math.sin(t);
        d[i] += v * vol * env;
      }
    }
  }
  function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numCh = buffer.numberOfChannels;
    const length = buffer.length * numCh * 2;
    const out = new ArrayBuffer(44 + length);
    const view = new DataView(out);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numCh * 2, true);
    view.setUint16(32, numCh * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);
    let off = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numCh; ch++) {
        const d = buffer.getChannelData(ch);
        const s = Math.max(-1, Math.min(1, d[i]));
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        off += 2;
      }
    }
    return new Blob([out], { type: 'audio/wav' });
  }
  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

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
    } catch { alert(t('adGenerator.micDenied')); }
  };

  const wordsRef = useRef<string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(-1);

  const drawScene = (ctx: CanvasRenderingContext2D, w: number, h: number, img: HTMLImageElement, subtitle?: string, highlightIdx?: number, mascot?: { talking: boolean; t: number }) => {
    ctx.clearRect(0, 0, w, h);
    const fn = template === 'modern' ? drawModern : template === 'sale' ? drawSale : template === 'social' ? drawSocial : drawLuxury;
    fn(ctx, w, h, img, brand, tagline);
    if (hostType !== 'none' && mascot) {
      if (hostType === 'mascot') drawMascot(ctx, w, h, mascot.talking, mascot.t);
      else drawHost(ctx, w, h, mascot.talking, mascot.t, hostType);
    }
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

  const speakWithHighlight = async () => {
    if (!voiceText.trim()) return;
    if (isSpeaking) { stopPreview(); return; }
    const words = voiceText.split(/\s+/);
    wordsRef.current = words;
    let url: string;
    try {
      setScriptStatus(t('adGenerator.generatingVoice'));
      url = await generateTtsBlob(voiceText);
      setScriptStatus('');
    } catch {
      setScriptStatus(t('adGenerator.errorTTS'));
      return;
    }
    const el = new Audio(url);
    previewAudioRef.current = el;
    setIsSpeaking(true);
    el.addEventListener('loadedmetadata', () => {
      const dur = el.duration || 3;
      const per = dur / words.length;
      let i = 0;
      previewTimerRef.current = window.setInterval(() => {
        if (i < words.length) setCurrentWordIdx(i++);
        else { if (previewTimerRef.current !== null) clearInterval(previewTimerRef.current); }
      }, per * 1000);
    });
    el.onended = () => stopPreview();
    el.onerror = () => stopPreview();
    el.play().catch(() => stopPreview());
  };

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  const stopPreview = () => {
    if (previewTimerRef.current !== null) { clearInterval(previewTimerRef.current); previewTimerRef.current = null; }
    if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current = null; }
    setIsSpeaking(false);
    setCurrentWordIdx(-1);
  };

  const ttsReady = useRef(false);
  useEffect(() => {
    if (!ttsReady.current) {
      meSpeak.loadConfig(mespeakConfig);
      const voice = LANG_CONFIG[activeLang].loadVoice;
      if (voice) meSpeak.loadVoice(voice);
      ttsReady.current = true;
    }
  }, [activeLang]);

  const buildMarketingScript = async (): Promise<string | null> => {
    const desc = productDesc.trim();
    if (!desc) return null;
    const b = (brand.trim() || t('adGenerator.defaultBrand'));
    const tgl = (tagline.trim() || '').replace(/\.$/, '');
    const wa = whatsapp.trim().replace(/[^0-9+]/g, '');
    const sequences = Math.max(images.length, 1);
    const spi = Math.max(secPerImg, 1);
    const targetSec = sequences * spi + (ctaReady() ? 3 : 0);
    try {
      const r = await fetch('/api/ai-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, brand: b, tagline: tgl, whatsapp: wa, language: activeLang, duration: targetSec, sequences, secPerImg: spi }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'IA indisponible');
      return String(d.script || '').trim() || null;
    } catch (e: any) {
      setScriptStatus(t('adGenerator.aiError').replace('...', e?.message || 'réseau'));
      return null;
    }
  };

  const generateAll = async () => {
    const script = await buildMarketingScript();
    if (!script) { setScriptStatus(t('adGenerator.aiNeedDesc')); return; }
    if (isSpeaking) stopPreview();
    setGeneratingMelody(true);
    setScriptStatus(t('adGenerator.allGenerating'));
    try {
      setVoiceText(script);
      setScriptStatus(t('adGenerator.generatingVoice'));
      await generateTtsBlob(script);
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const totalSec = images.length * Math.max(secPerImg, 1) + 4;
      const duration = Math.min(Math.max(totalSec, 5), 25);
      const ctx = new AudioCtx({ sampleRate: 22050 });
      const buffer = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
      const style = MELODY_STYLES[melodyStyle];
      const barLen = Math.floor(ctx.sampleRate * (4 * 60 / style.bpm));
      let out = 0;
      for (let c = 0; c < style.chords.length; c++) {
        const chord = style.chords[c];
        const barEnd = (c + 1) * barLen;
        chord.forEach((m, j) => {
          const freq = style.base * m;
          padNote(buffer, out, barEnd, freq, style.padVol * (j / chord.length + 0.4));
          if (c > 0) padNote(buffer, out, barEnd, freq, style.padVol * (j / chord.length + 0.4), barLen);
        });
        const pattern = chord.slice();
        for (let step = 0; step < style.stepsPerBar; step++) {
          const place = out + Math.floor(step * (barLen / style.stepsPerBar));
          const m = pattern[step % pattern.length];
          pluckNote(buffer, place, place + barLen / style.stepsPerBar, style.base * m * style.noteMul, style.noteVol, style.wave);
        }
        out = barEnd;
      }
      const fade = Math.floor(ctx.sampleRate * 0.4);
      for (let ch = 0; ch < 2; ch++) {
        const d = buffer.getChannelData(ch);
        for (let i = 0; i < fade; i++) d[i] *= i / fade;
        for (let i = buffer.length - fade; i < buffer.length; i++) d[i] *= (buffer.length - i) / fade;
      }
      const blob = audioBufferToWav(buffer);
      ctx.close();
      const dataUrl = URL.createObjectURL(blob);
      if (musicUrl) URL.revokeObjectURL(musicUrl);
      setMusicUrl(dataUrl);
      setMusicFile(new File([blob], `melody_${melodyStyle}.wav`, { type: 'audio/wav' }));
      setMelodyActive(true);
      setScriptStatus(t('adGenerator.allDone'));
    } catch {
      setScriptStatus(t('adGenerator.aiNeedDesc'));
    }
    setGeneratingMelody(false);
  };

  const generateMarketingScript = async () => {
    const script = await buildMarketingScript();
    if (!script) { setScriptStatus(t('adGenerator.aiNeedDesc')); return; }
    setVoiceText(script);
    setScriptStatus(t('adGenerator.aiDone'));
    if (!isSpeaking) setTimeout(() => speakWithHighlight(), 100);
  };

  const ctaReady = () => Boolean(whatsapp.trim() || storeLink.trim());

  const ttsCache = useRef<Record<string, string>>({});

  const generateTtsBlob = async (text: string): Promise<string> => {
    if (ttsCache.current[text]) return ttsCache.current[text];
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const maxLen = 180;
    const raw = text.replace(/\s+/g, ' ').trim();
    if (!raw) throw new Error(t('adGenerator.errorTTS'));

    const chunks: string[] = [];
    let start = 0;
    while (start < raw.length) {
      let end = Math.min(raw.length, start + maxLen);
      if (end < raw.length) {
        const idx = raw.lastIndexOf(' ', end);
        if (idx > start) end = idx;
      }
      chunks.push(raw.slice(start, end).trim());
      start = end;
    }

    const tl = LANG_CONFIG[activeLang].tts;
    try {
      const results: ArrayBuffer[] = [];
      for (const chunk of chunks) {
        const resp = await fetch(`/api/tts?text=${encodeURIComponent(chunk)}&lang=${tl}`, { mode: 'cors' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        results.push(await resp.arrayBuffer());
      }

      const ctx = new AudioCtx();
      const decoded: AudioBuffer[] = [];
      for (const ab of results) {
        try { decoded.push(await ctx.decodeAudioData(ab)); } catch {}
      }
      if (decoded.length === 0) throw new Error('TTS');

      const sr = ctx.sampleRate;
      const total = decoded.reduce((a, b) => a + b.length, 0);
      const merged = ctx.createBuffer(2, total, sr);
      let offset = 0;
      for (const d of decoded) {
        for (let ch = 0; ch < 2; ch++) {
          merged.getChannelData(ch).set(d.getChannelData(Math.min(ch, d.numberOfChannels - 1)), offset);
        }
        offset += d.length;
      }
      const dataUrl = URL.createObjectURL(audioBufferToWav(merged));
      ctx.close();
      ttsCache.current[text] = dataUrl;
      return dataUrl;
    } catch {
      const voice = LANG_CONFIG[activeLang].meSpeakVoice;
      if (!voice) throw new Error(t('adGenerator.errorTTS'));
      const dataUrl = meSpeak.speak(raw, {
        rawdata: 'data-url', voice, variant: 'f2',
        speed: 130, pitch: 50, amplitude: 140,
      });
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
        ttsCache.current[text] = dataUrl;
        return dataUrl;
      }
      throw new Error(t('adGenerator.errorTTS'));
    }
  };

  const [previewImages, setPreviewImages] = useState<HTMLImageElement[]>([]);
  useEffect(() => {
    if (!canvasRef.current || previewImages.length === 0) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const fmt = FORMATS[format]; canvas.width = fmt.width; canvas.height = fmt.height;
    drawScene(ctx, fmt.width, fmt.height, previewImages[0], voiceText || undefined, currentWordIdx, { talking: currentWordIdx >= 0, t: performance.now() });
  }, [currentWordIdx, format, template, brand, tagline, previewImages, voiceText]);

  const preloadPreviewImages = () => {
    Promise.all(images.map(img => new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = img.dataUrl;
    }))).then(setPreviewImages);
  };

  useEffect(() => { preloadPreviewImages(); }, [images]);

  useEffect(() => { if (recordedAudioRef.current) recordedAudioRef.current.volume = voiceVolume / 100; }, [voiceVolume]);
  useEffect(() => { if (musicAudioRef.current) musicAudioRef.current.volume = musicVolume / 100; }, [musicVolume]);

  useEffect(() => () => { stopPreview(); }, []);

  const generate = async () => {
    if (images.length === 0 || !canvasRef.current) return;
    if (isSpeaking) stopPreview();
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
    setProgress(t('adGenerator.preparing'));

    try {
      const preloaded = await Promise.all(images.map(img => new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = img.dataUrl;
      })));

      drawScene(ctx, w, h, preloaded[0], voiceText || undefined);
      const videoStream = canvas.captureStream(fps);
      const vt = videoStream.getVideoTracks()[0];
      if (!vt) { setVideoError('Pas de piste vidéo'); return; }

      const chunks: BlobPart[] = [];

      let silentCtx: AudioContext | null = null;
      let finalDur = images.length * spi;
      let voiceBuf: AudioBuffer | null = null;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        silentCtx = new AudioCtx();
        await silentCtx.resume();

        let voiceUrl = recordedUrl;
        if (!voiceUrl && voiceText.trim()) {
          setProgress(t('adGenerator.generatingVoice'));
          voiceUrl = await generateTtsBlob(voiceText);
        }
        if (voiceUrl) {
          setProgress(t('adGenerator.voiceover'));
          const arr = await (await fetch(voiceUrl)).arrayBuffer();
          try { voiceBuf = await silentCtx.decodeAudioData(arr); } catch {}
        }
        let musicBuf: AudioBuffer | null = null;
        if (musicUrl) {
          setProgress(t('adGenerator.musicGenerating'));
          const arr = await (await fetch(musicUrl)).arrayBuffer();
          try { musicBuf = await silentCtx.decodeAudioData(arr); } catch {}
        }

        const visDur = images.length * spi;
        const voiceDur = voiceBuf ? voiceBuf.duration : 0;
        const dur = Math.max(visDur, voiceDur);

        const ctaLen = ctaReady() ? 3 : 0;
        const buf = silentCtx.createBuffer(2, Math.max(1, Math.ceil(silentCtx.sampleRate * (dur + ctaLen))), silentCtx.sampleRate);
        if (voiceBuf) {
          const vv = (voiceMuted ? 0 : voiceVolume) / 100;
          if (vv > 0) {
            for (let ch = 0; ch < 2; ch++) {
              const d = buf.getChannelData(ch);
              const v = voiceBuf.getChannelData(Math.min(ch, voiceBuf.numberOfChannels - 1));
              for (let i = 0; i < voiceBuf.length; i++) d[i] += v[i] * vv;
            }
          }
        }
        if (musicBuf) {
          const mv = (musicMuted ? 0 : musicVolume) / 100;
          if (mv > 0) {
            for (let ch = 0; ch < 2; ch++) {
              const d = buf.getChannelData(ch);
              const m = musicBuf.getChannelData(Math.min(ch, musicBuf.numberOfChannels - 1));
              for (let i = 0; i < buf.length; i++) d[i] += m[i % musicBuf.length] * mv;
            }
          }
        }

        finalDur = dur;
        const src = silentCtx.createBufferSource(); src.buffer = buf;
        const dest = silentCtx.createMediaStreamDestination();
        src.connect(dest); src.start();
        for (const t of dest.stream.getAudioTracks()) videoStream.addTrack(t);
      } catch (e: any) {
        setVideoError(t('adGenerator.errorAudio').replace('...', e?.message || 'vérifie le format audio')); setExporting(false);
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
        if (silentCtx) silentCtx.close();
        const b = new Blob(chunks, { type: 'video/webm' });
        if (b.size === 0) { setVideoError(t('adGenerator.errorEmptyFile')); setExporting(false); return; }
        setVideoUrl(URL.createObjectURL(b));
        setExporting(false); setProgress('');
      };
      rec.onerror = () => { setVideoError(t('adGenerator.errorEncoding')); stopRec(); if (silentCtx) silentCtx.close(); setExporting(false); };

      rec.start(500);
      const t0 = performance.now();
      let prevImgIdx = -1;
      let stopped = false;

      const totalDur = finalDur;
      const words = voiceText ? voiceText.split(/\s+/) : [];
      let leadIn = 0;
      if (voiceBuf && voiceBuf.length > 0) {
        const d = voiceBuf.getChannelData(0);
        const sr = voiceBuf.sampleRate;
        const thresh = 0.01;
        for (let i = 0; i < d.length; i++) {
          if (Math.abs(d[i]) > thresh) { leadIn = i / sr; break; }
        }
      }
      const voiceDur = voiceBuf ? voiceBuf.duration : 0;
      const speakableDur = voiceDur > 0 ? Math.max(voiceDur - leadIn, 0.1) : totalDur;
      const wordDur = words.length > 0 ? (voiceDur > 0 ? speakableDur / words.length : totalDur / words.length) : Infinity;
      const ctaDur = ctaReady() ? 3 : 0;
      const ctaStart = totalDur;

      const tick = () => {
        if (stopped) return;
        try {
          const elapsed = (performance.now() - t0) / 1000;
          if (elapsed >= totalDur + ctaDur + 0.5) { stopped = true; stopRec(); return; }
          if (elapsed >= ctaStart) {
            drawCtaScene(ctx, w, h, whatsapp, storeLink, t('adGenerator.ctaTitle'), t('adGenerator.ctaWhatsApp'), t('adGenerator.ctaFooter'));
          } else {
            const idx = Math.min(Math.floor(elapsed / spi), preloaded.length - 1);
            const speaking = wordDur < Infinity && elapsed >= leadIn && elapsed < leadIn + speakableDur;
            const hIdx = speaking ? Math.min(Math.floor((elapsed - leadIn) / wordDur), words.length - 1) : undefined;
            drawScene(ctx, w, h, preloaded[idx], voiceText || undefined, hIdx, { talking: hIdx !== undefined && hIdx >= 0, t: performance.now() });
            if (idx !== prevImgIdx) { prevImgIdx = idx; setProgress(`Image ${idx + 1}/${preloaded.length}`); }
          }
        } catch (e: any) { setVideoError(t('adGenerator.errorGeneric').replace('...', e?.message || 'inconnue')); stopped = true; stopRec(); setExporting(false); return; }
        timerRef.current = window.setTimeout(tick, frameMs);
      };

      tick();
      setTimeout(() => { if (!stopped && !videoUrl) { setVideoError(t('adGenerator.errorTimeout')); stopRec(); setExporting(false); } }, (totalDur + ctaDur + 8) * 1000);

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
              <Download size={16} /> {t('adGenerator.download')}
            </a>
            <button onClick={reset}
              className="py-3 px-6 border border-gold/30 text-gold text-xs uppercase tracking-widest rounded-sm hover:bg-gold/10 transition-all">
              {t('adGenerator.redo')}
            </button>
          </div>
        </div>
      ) : exporting ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 bg-black border border-gold/20 rounded-lg">
          <RefreshCw size={32} className="text-gold animate-spin" />
          <span className="text-gold text-sm font-bold">{t('adGenerator.generating').replace('{progress}', progress)}</span>
        </div>
      ) : (
        <div className="space-y-4">
          <canvas ref={canvasRef} className="w-full max-h-[65vh] rounded-lg border border-gold/10 bg-black object-contain" style={{ aspectRatio: `${fmt.width}/${fmt.height}` }} />
          <button onClick={generate} disabled={images.length === 0}
            className="w-full py-4 bg-gold text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center justify-center gap-3">
            <Film size={20} /> {t('adGenerator.export').replace('X', String(images.length))}
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-black border border-gold/10 rounded-lg p-4 space-y-3">
          <h3 className="text-gold text-xs font-bold uppercase tracking-widest">{t('adGenerator.audio')}</h3>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">{t('adGenerator.audioText')}</label>
            <div className="flex gap-2">
              <textarea value={voiceText} onChange={e => setVoiceText(e.target.value)}
                placeholder={t('adGenerator.audioPlaceholder')}
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
              <Mic size={12} /> {isRecording ? t('adGenerator.microphoneStop') : recordedBlob ? t('adGenerator.microphoneOn') : t('adGenerator.microphone')}
            </button>
            <button onClick={() => musicRef.current?.click()}
              className={`py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 ${musicFile ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-black border border-gold/10 text-gray-400 hover:border-gold/30'}`}>
              <Music size={12} /> {musicFile ? t('adGenerator.musicOn') : t('adGenerator.music')}
            </button>
            <div className="col-span-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">{t('adGenerator.melodyStyle')}</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(MELODY_STYLES) as MelodyStyle[]).map((s) => (
                  <button key={s} onClick={() => setMelodyStyle(s)}
                    className={`py-1.5 px-2 rounded-sm text-[10px] font-bold text-center transition-all ${melodyStyle === s ? 'bg-gold text-black' : 'bg-luxury-dark border border-gold/10 text-gray-400 hover:border-gold/30'}`}>
                    {t(MELODY_STYLES[s].labelKey)}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={generateMelody} disabled={generatingMelody}
              className="py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 col-span-2 bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition-all disabled:opacity-40">
              <Music size={12} /> {generatingMelody ? '...' : (melodyActive ? t('adGenerator.melodyOn') : t('adGenerator.melody'))}
            </button>
          </div>
          {voiceText.trim() && !recordedBlob && (
            <p className="text-[9px] text-gray-500 italic pt-1">
              {t('adGenerator.noRecording')}
            </p>
          )}
          {(recordedBlob || musicFile) && (
            <div className="space-y-2 pt-1">
              {recordedBlob && (
                <div>
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest">{t('adGenerator.voiceVolume')}</label>
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
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest">{t('adGenerator.musicVolume')}</label>
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
          <h3 className="text-gold text-xs font-bold uppercase tracking-widest">{t('adGenerator.images').replace('0', String(images.length))}</h3>
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
              <Upload size={20} /><span>{t('adGenerator.addImages')}</span>
            </button>
          )}
          <button onClick={() => fileRef.current?.click()} className="w-full py-2 bg-luxury-dark border border-dashed border-gold/10 rounded-sm text-gold/40 text-[10px] hover:border-gold/30">{t('adGenerator.add')}</button>
        </div>

        <div className="space-y-3">
          <div className="bg-black border border-gold/10 rounded-lg p-4">
            <h3 className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Sparkles size={12} /> {t('adGenerator.aiTitle')}</h3>
            <label className="text-[10px] text-gray-500 block mt-2 mb-1">{t('adGenerator.aiDesc')}</label>
            <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)}
              placeholder={t('adGenerator.aiPlaceholder')}
              rows={3} className="w-full px-3 py-2.5 bg-luxury-dark border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-xs resize-none" />
            <button onClick={generateAll} disabled={generatingMelody}
              className="mt-2 w-full py-3 bg-gold text-black text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all flex items-center justify-center gap-2 disabled:opacity-40">
              <Sparkles size={14} /> {generatingMelody ? '...' : t('adGenerator.allGenerate')}
            </button>
            <button onClick={generateMarketingScript}
              className="mt-2 w-full py-2.5 bg-gold/10 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-gold/20 transition-all flex items-center justify-center gap-2">
              <Sparkles size={13} /> {t('adGenerator.aiGenerate')}
            </button>
            {scriptStatus && <p className="text-[10px] text-gold/70 mt-2 text-center">{scriptStatus}</p>}
            <div className="grid grid-cols-1 gap-2 mt-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">{t('adGenerator.ctaWhatsApp')}</label>
                <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+243..."
                  className="w-full px-3 py-2.5 bg-luxury-dark border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">{t('adGenerator.ctaLink')}</label>
                <input type="url" value={storeLink} onChange={e => setStoreLink(e.target.value)} placeholder="https://..."
                  className="w-full px-3 py-2.5 bg-luxury-dark border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-xs" />
              </div>
            </div>
            {ctaReady() && <p className="text-[10px] text-gold/70 mt-2 flex items-center gap-1"><MessageCircle size={11} /> {t('adGenerator.ctaIncluded')}</p>}
          </div>

          <div className="bg-black border border-gold/10 rounded-lg p-4">
            <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-2">{t('adGenerator.brand')}</label>
            <input type="text" value={brand} onChange={e => setBrand(e.target.value)} className="w-full px-3 py-2.5 bg-luxury-dark border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm" />
          </div>
          <div className="bg-black border border-gold/10 rounded-lg p-4">
            <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-2">{t('adGenerator.tagline')}</label>
            <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} className="w-full px-3 py-2.5 bg-luxury-dark border border-gold/10 rounded-sm text-white focus:border-gold outline-none text-sm" />
          </div>
          <div className="bg-black border border-gold/10 rounded-lg p-4">
            <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-2">{t('adGenerator.durationPerImage')}</label>
            <div className="flex items-center gap-3">
              <input type="range" min="1" max="10" value={secPerImg} onChange={e => setSecPerImg(Number(e.target.value))} className="flex-1 accent-gold" />
              <span className="text-gold text-sm font-bold w-8 text-right">{secPerImg}s</span>
            </div>
            <p className="text-gray-600 text-[10px] mt-1">{t('adGenerator.totalDuration').replace('X', String(images.length * secPerImg))}</p>
          </div>
          <div className="bg-black border border-gold/10 rounded-lg p-4">
            <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-2">{t('adGenerator.template')}</label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={() => setTemplate(tpl.id)}
                  className={`px-3 py-2.5 rounded-sm text-xs text-left transition-all ${template === tpl.id ? 'bg-gold text-black font-bold' : 'bg-luxury-dark border border-gold/10 text-gray-400 hover:border-gold/30'}`}>
                  <div className="font-bold">{t(tpl.labelKey)}</div>
                  <div className="text-[9px] opacity-70">{t(tpl.descKey)}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-black border border-gold/10 rounded-lg p-4">
            <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-2">{t('adGenerator.format')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(FORMATS) as [AdFormat, typeof FORMATS[AdFormat]][]).map(([key, f]) => (
                <button key={key} onClick={() => setFormat(key)}
                  className={`px-3 py-2.5 rounded-sm text-xs text-left transition-all ${format === key ? 'bg-gold text-black font-bold' : 'bg-luxury-dark border border-gold/10 text-gray-400 hover:border-gold/30'}`}>
                  <div className="font-bold">{t(f.labelKey)}</div>
                  <div className="text-[9px] opacity-70">{f.width}x{f.height}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-black border border-gold/10 rounded-lg p-4">
            <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-2">{t('adGenerator.mascot')}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['mascot', 'woman', 'man', 'none'] as HostType[]).map((h) => (
                <button key={h} onClick={() => setHostType(h)}
                  className={`py-2 rounded-sm text-sm font-bold transition-all ${hostType === h ? 'bg-gold text-black' : 'bg-luxury-dark border border-gold/10 text-gray-400 hover:border-gold/30'}`}>
                  {h === 'mascot' ? '🐻' : h === 'woman' ? '👩' : h === 'man' ? '👨' : '🙈'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill();
}

function drawHost(ctx: CanvasRenderingContext2D, w: number, h: number, talking: boolean, t: number, gender: HostType) {
  const isTall = h > w;
  const R = Math.max(Math.min(w, h) * (isTall ? 0.12 : 0.13), 22);
  const cx = isTall ? Math.max(w * 0.17, 36) : Math.max(w * 0.12, 40);
  const baseY = isTall ? h * 0.22 : h * 0.74;
  ctx.save();
  const bounce = talking ? Math.abs(Math.sin(t / 160)) * R * 0.08 : 0;
  ctx.translate(0, -bounce);

  const skin = '#eabb90';
  const bodyW = R * 1.9, bodyH = R * 1.6;
  const topY = baseY - bodyH * 0.35;

  if (gender === 'female') {
    ctx.fillStyle = '#7c2d9e';
    ctx.beginPath();
    ctx.moveTo(cx - bodyW * 0.4, topY);
    ctx.quadraticCurveTo(cx - bodyW * 0.62, baseY + bodyH * 0.5, cx - bodyW * 0.9, baseY + bodyH * 0.9);
    ctx.lineTo(cx + bodyW * 0.9, baseY + bodyH * 0.9);
    ctx.quadraticCurveTo(cx + bodyW * 0.62, baseY + bodyH * 0.5, cx + bodyW * 0.4, topY);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, topY + R * 0.1, R * 0.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  } else {
    ctx.fillStyle = '#1c2b4a';
    ctx.beginPath();
    ctx.moveTo(cx - bodyW * 0.42, topY);
    ctx.quadraticCurveTo(cx - bodyW * 0.55, baseY + bodyH * 0.35, cx - bodyW * 0.6, baseY + bodyH * 0.9);
    ctx.lineTo(cx + bodyW * 0.6, baseY + bodyH * 0.9);
    ctx.quadraticCurveTo(cx + bodyW * 0.55, baseY + bodyH * 0.35, cx + bodyW * 0.42, topY);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.18, topY);
    ctx.lineTo(cx + R * 0.18, topY);
    ctx.lineTo(cx + R * 0.1, baseY + R * 0.5);
    ctx.lineTo(cx - R * 0.1, baseY + R * 0.5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.06, topY);
    ctx.lineTo(cx + R * 0.06, topY);
    ctx.lineTo(cx + R * 0.12, baseY + R * 0.45);
    ctx.lineTo(cx - R * 0.12, baseY + R * 0.45);
    ctx.closePath(); ctx.fill();
  }

  const neckH = R * 0.35;
  ctx.fillStyle = skin;
  ctx.fillRect(cx - R * 0.16, topY - neckH, R * 0.32, neckH);

  const headC = topY - neckH - R * 0.45 + R * 0.15;
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(cx, headC, R, 0, Math.PI * 2); ctx.fill();

  if (gender === 'female') {
    ctx.fillStyle = '#2b1a10';
    ctx.beginPath(); ctx.arc(cx, headC - R * 0.1, R * 1.02, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - R * 1.0, headC - R * 0.2, R * 0.28, R * 1.1);
    ctx.fillRect(cx + R * 0.72, headC - R * 0.2, R * 0.28, R * 1.1);
    ctx.beginPath(); ctx.arc(cx + R * 0.2, headC - R * 0.35, R * 0.3, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath(); ctx.arc(cx, headC - R * 0.1, R, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - R * 0.92, headC - R * 0.05, R * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + R * 0.92, headC - R * 0.05, R * 0.22, 0, Math.PI * 2); ctx.fill();
  }

  const eyeY = headC + R * 0.1;
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath(); ctx.arc(cx - R * 0.3, eyeY, R * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + R * 0.3, eyeY, R * 0.09, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(255,150,120,0.5)';
  ctx.beginPath(); ctx.arc(cx - R * 0.55, headC + R * 0.28, R * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + R * 0.55, headC + R * 0.28, R * 0.09, 0, Math.PI * 2); ctx.fill();

  const mouthY = headC + R * 0.42;
  if (talking) {
    const open = (Math.sin(t / 70) + 1) / 2;
    const mw = R * 0.28, mh = R * 0.05 + open * R * 0.22;
    ctx.fillStyle = '#6b2418';
    ctx.beginPath(); ctx.ellipse(cx, mouthY, mw, mh, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8585';
    ctx.beginPath(); ctx.ellipse(cx, mouthY + mh * 0.35, mw * 0.45, mh * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = '#6b2418'; ctx.lineWidth = Math.max(2, R * 0.05);
    ctx.beginPath(); ctx.arc(cx, headC + R * 0.32, R * 0.2, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }

  if (gender === 'female') {
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.arc(cx - R * 0.95, headC + R * 0.4, R * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + R * 0.95, headC + R * 0.4, R * 0.06, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

function drawMascot(ctx: CanvasRenderingContext2D, w: number, h: number, talking: boolean, t: number, label: string) {
  const isTall = h > w;
  const R = Math.max(Math.min(w, h) * (isTall ? 0.11 : 0.12), 20);
  const cx = isTall ? Math.max(w * 0.16, 34) : Math.max(w * 0.11, 36);
  const cy = isTall ? h * 0.16 : h * 0.66;
  ctx.save();
  const bounce = talking ? Math.abs(Math.sin(t / 160)) * R * 0.1 : 0;
  ctx.translate(0, -bounce);

  ctx.fillStyle = 'rgba(212,175,55,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + R * 1.1, R * 0.9, R * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(212,175,55,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + R * 0.55, R * 0.72, R * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffd97a';
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.stroke();

  const earY = cy - R * 0.65;
  ctx.fillStyle = '#ffd97a';
  ctx.beginPath(); ctx.arc(cx - R * 1.0, earY, R * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + R * 1.0, earY, R * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#3a2a1a';
  const eyeY = cy - R * 0.12;
  ctx.beginPath(); ctx.arc(cx - R * 0.3, eyeY, R * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + R * 0.3, eyeY, R * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - R * 0.33, eyeY - R * 0.05, R * 0.035, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + R * 0.27, eyeY - R * 0.05, R * 0.035, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(255,150,100,0.45)';
  ctx.beginPath(); ctx.arc(cx - R * 0.58, cy + R * 0.16, R * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + R * 0.58, cy + R * 0.16, R * 0.12, 0, Math.PI * 2); ctx.fill();

  const mouthY = cy + R * 0.32;
  if (talking) {
    const open = (Math.sin(t / 70) + 1) / 2;
    const mw = R * 0.34, mh = R * 0.06 + open * R * 0.3;
    ctx.fillStyle = '#4a1a12';
    ctx.beginPath();
    ctx.ellipse(cx, mouthY, mw, mh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.ellipse(cx, mouthY + mh * 0.35, mw * 0.5, mh * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#4a1a12'; ctx.lineWidth = Math.max(2, R * 0.06);
    ctx.beginPath();
    ctx.arc(cx, cy + R * 0.2, R * 0.26, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }

  ctx.fillStyle = GOLD;
  drawStar(ctx, cx + R * 0.75, cy - R * 0.85, R * 0.16);

  ctx.restore();
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

function drawCtaScene(ctx: CanvasRenderingContext2D, w: number, h: number, whatsapp: string, storeLink: string, title: string, waLabel: string, footer: string) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, BLACK); g.addColorStop(0.5, DARK); g.addColorStop(1, BLACK);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(2, h * 0.006);
  ctx.strokeRect(Math.max(w * 0.05, 20), Math.max(h * 0.05, 15), w - Math.max(w * 0.1, 40), h - Math.max(h * 0.1, 30));

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cx = w / 2;
  let y = h * 0.16;

  ctx.fillStyle = WHITE; ctx.font = `bold ${Math.max(h * 0.07, 20)}px sans-serif`;
  ctx.fillText(title, cx, y); y += h * 0.12;

  const cleanWa = whatsapp.trim().replace(/^0+/, '+243').replace(/\s+/g, '');
  const waText = cleanWa ? `${waLabel} ${cleanWa}` : waLabel;
  const waH = Math.max(h * 0.085, 36);
  const btnFont = Math.max(h * 0.04, 16);
  ctx.font = `bold ${btnFont}px sans-serif`;
  const waW = Math.min(w * 0.82, Math.max(ctx.measureText(waText).width + waH, 260));
  ctx.fillStyle = '#25D366';
  ctx.beginPath();
  ctx.roundRect(cx - waW / 2, y, waW, waH, Math.max(waH / 2, 12));
  ctx.fill();
  ctx.fillStyle = BLACK;
  ctx.fillText(waText, cx, y + waH / 2);
  y += waH + h * 0.05;

  if (storeLink.trim()) {
    const link = storeLink.trim();
    ctx.fillStyle = GOLD_LIGHT; ctx.font = `bold ${Math.max(h * 0.03, 12)}px sans-serif`;
    const disp = link.length > 42 ? link.slice(0, 39) + '...' : link;
    ctx.fillText(disp, cx, y); y += h * 0.07;
  }

  ctx.fillStyle = 'rgba(212,175,55,0.85)'; ctx.font = `bold ${Math.max(h * 0.03, 12)}px sans-serif`;
  ctx.fillText(footer, cx, y);
}

function drawProductImage(ctx: CanvasRenderingContext2D, w: number, h: number, img: HTMLImageElement, pos: 'right' | 'center' | 'left') {  if (!img.complete || img.naturalWidth === 0) return;
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
