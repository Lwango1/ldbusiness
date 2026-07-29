// Remplacé par init-upload.ts + publish.ts (deux étapes pour upload direct depuis le navigateur)
export default async function handler(req: any, res: any) {
  return res.status(410).json({ error: 'Utilise /tiktok/init-upload puis /tiktok/publish' });
}
