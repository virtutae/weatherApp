import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ensemble.weather',
  appName: 'Ensemble',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: '#0B0F1A',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B0F1A',
    },
  },
  android: {
    backgroundColor: '#0B0F1A',
  },
  ios: {
    backgroundColor: '#0B0F1A',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
}

export default config
