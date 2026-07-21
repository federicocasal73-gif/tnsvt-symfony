import { CapacitorConfig } from '@capacitor/cli';

/**
 * ⛧ TNSVT - Reino del Cristo Íntegro
 * Capacitor v8.x config — APK Web Android (OFFLINE-FIRST v4.24+)
 *
 * Esta APK arranca desde los assets bundleados en
 * `android/app/src/main/assets/public/` (espejo 1:1 de `public/`).
 * NO usa `server.url`, por lo tanto la UI funciona offline
 * al 100 % para todo lo estático (login screen, journal cache,
 * settings, sidebar, hub). Las llamadas a `/api/*` van contra
 * el backend configurado en `assets/api.js` baseURL
 * (que se setea por runtime: ver `first-run modal` y
 * `tnsvt_api_base` en localStorage).
 *
 * Actualizar la web requiere rebuild + redistribución de la APK.
 */

const config: CapacitorConfig = {
  appId: 'com.tnsvt.app',
  appName: 'TNSVT',
  webDir: 'public',

  // ─── WebView nativo ───────────────────────────────────────
  android: {
    allowMixedContent: false, // mismo-scheme (https://localhost) → nada mixto
    captureInput: true,
    webContentsDebuggingEnabled: false,
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
    Network: {},
  },
};

export default config;
