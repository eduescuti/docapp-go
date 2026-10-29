import type { ExpoConfig } from "expo/config";

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const config: ExpoConfig = {
  name: "DocApp Go",
  slug: "docapp-go",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "docappgo",
  // La app arranca en modo claro aunque el teléfono esté en oscuro (el oscuro se elige en Configuración).
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.docappgo.app",
    config: {
      googleMapsApiKey,
    },
  },
  android: {
    package: "com.docappgo.app",
    adaptiveIcon: {
      backgroundColor: "#0284C7",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
    googleServicesFile: "./google-services.json",
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#0284c7",
      },
    ],
    "expo-router",
    [
      // Pantalla de carga: el logo de DocApp Go (el mismo del login) sobre el fondo del tema claro.
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 160,
        resizeMode: "contain",
        backgroundColor: "#FFFFFF",
      },
    ],
    // Guarda el token de sesión cifrado (Keychain / Keystore).
    "expo-secure-store",
    [
      // Foto de perfil: cámara o galería. Solo fotos, así que el micrófono queda bloqueado.
      "expo-image-picker",
      {
        photosPermission: "DocApp Go usa tus fotos para que elijas tu foto de perfil.",
        cameraPermission: "DocApp Go usa la cámara para que saques tu foto de perfil.",
        microphonePermission: false,
      },
    ],
    [
      // Verificación de identidad del registro: lee el código PDF417 del DNI. No graba video ni audio.
      "expo-camera",
      {
        cameraPermission: "DocApp Go usa la cámara para leer el código de barras de tu DNI y verificar tu identidad.",
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "DocApp Go usa tu ubicación para mostrarte instituciones médicas cercanas.",
        locationWhenInUsePermission:
          "Usamos tu ubicación para mostrarte los centros de salud más cercanos que aceptan tu cobertura.",
      },
    ],
  ],
  extra: {
    eas: {
      projectId: "728cb1fa-cb6e-4462-914f-4a8feadbf32e", // 👈 Pegá acá el UUID que te dio EAS
    },
  },

  
};

export default config;