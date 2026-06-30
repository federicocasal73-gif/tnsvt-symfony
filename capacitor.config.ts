import { CapacitorConfig } from '@capacitor/cli';

/**
 * ⛧ TNSVT - Reino del Cristo Íntegro
 * Capacitor v8.x config — APK Web Android (SHELL ONLINE)
 *
 * Esta APK NO contiene copia local de la web: se conecta a
 * https://federicocasal73-gif.com y la envuelve en un WebView
 * nativo con status bar, safe areas, back button, push, etc.
 *
 * Cualquier deploy a Symfony aparece inmediatamente en la app.
 */

const config: CapacitorConfig = {
  appId: 'com.tnsvt.app',
  appName: 'TNSVT',
  // webDir obligatorio (Capacitor lo usa para indexar assets locales).
  // Como server.url está definido, la APK ignora webDir en runtime.
  webDir: 'public',

  // ─── SHELL ONLINE / local development ────────────────────
  server: {
    url: 'http://192.168.1.2:8000',
    cleartext: true,
    androidScheme: 'http',
    allowNavigation: ['*'],
  },

  // ─── WebView nativo ───────────────────────────────────────
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false, // false en release (true en debug)
    backgroundColor: '#07030f',
  },

  // ─── Plugins Capacitor v8 ─────────────────────────────────
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#07030f',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#d4af37',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#07030f',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Network: {
      // Sin opciones especiales, default funciona
    },
  },
};

export default config;
