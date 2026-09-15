import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.matecska.Matecska',
  appName: 'Matecska',
  webDir: 'dist',
  ios: {
    // A webnézet a státuszsáv alá is kiterjed; a biztonságos zónát csak a CSS env(safe-area-inset-*) kezeli,
    // különben duplán számítódna.
    contentInset: 'never',
    backgroundColor: '#FDF6E3',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 500,
      backgroundColor: '#FDF6E3',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DEFAULT',
    },
  },
};

export default config;
