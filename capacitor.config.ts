import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ldbusiness.app',
  appName: 'LDBusiness',
  webDir: 'dist',
  server: {
    hostname: 'ldbusiness.vercel.app',
    androidScheme: 'https'
  }
};

export default config;
