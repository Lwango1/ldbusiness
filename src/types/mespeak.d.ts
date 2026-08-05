declare module 'mespeak' {
  interface SpeakArgs {
    rawdata?: string;
    voice?: string;
    speed?: number;
    pitch?: number;
    amplitude?: number;
    wordgap?: number;
    variant?: string;
    linebreak?: number;
    capitals?: number;
    nostop?: boolean;
    punct?: string | boolean;
    ssml?: boolean;
    utf16?: boolean;
    a?: number;
    g?: number;
    p?: number;
    s?: number;
    b?: number;
    v?: string;
    l?: number;
    k?: number;
    z?: boolean;
    m?: boolean;
  }
  interface MeSpeak {
    speak(text: string, args?: SpeakArgs): number | ArrayBuffer | number[] | string | null;
    loadConfig(data: object): void;
    loadVoice(data: object): void;
    setDefaultVoice(voice: string): void;
    isConfigLoaded(): boolean;
    isVoiceLoaded(voice: string): boolean;
  }
  const meSpeak: MeSpeak;
  export default meSpeak;
}
declare module 'mespeak/src/mespeak_config.json' {
  const value: object;
  export default value;
}
declare module 'mespeak/voices/fr.json' {
  const value: { voice_id: string; dict_id: string; dict: string; voice: string };
  export default value;
}