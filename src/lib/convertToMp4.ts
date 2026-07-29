import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let loaded = false;

const CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

async function getFFmpeg(): Promise<FFmpeg> {
  if (loaded && ffmpeg) return ffmpeg!;
  ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(`${CORE_URL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${CORE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  loaded = true;
  return ffmpeg;
}

export async function webmToMp4(webmBlob: Blob): Promise<Blob> {
  const ff = await getFFmpeg();
  await ff.writeFile('input.webm', await fetchFile(webmBlob));
  await ff.exec(['-i', 'input.webm', '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac', '-movflags', '+faststart', 'output.mp4']);
  const data = (await ff.readFile('output.mp4')) as Uint8Array;
  return new Blob([data.buffer as ArrayBuffer], { type: 'video/mp4' });
}
