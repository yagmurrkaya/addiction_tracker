export default {
  expo: {
    name: "addiction_tracker",
    slug: "addiction_tracker",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "addictiontracker",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    updates: {
      url: "https://u.expo.dev/a50efa03-047e-4065-8955-340a2dfad967",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    extra: {
      eas: {
        projectId: "a50efa03-047e-4065-8955-340a2dfad967",
      },
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yagmur.addictiontracker",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Riskli bölgeleri haritada görebilmeniz için konum izni gereklidir.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Uygulama kapalıyken bile sizi koruyabilmemiz için konum iznini 'Her Zaman' yapmalısınız.",
        NSLocationAlwaysUsageDescription:
          "Arka planda konum takibi yaparak riskli bölgelerde bildirim gönderebilmemiz için bu izin şarttır.",
        UIBackgroundModes: ["location", "fetch", "remote-notification"],
      },
    },
    android: {
      package: "com.yagmur.addictiontracker",
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Riskli bölgelerde sizi koruyabilmemiz için 'Her Zaman' konum iznine ihtiyacımız var.",
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
      [
        "expo-notifications",
        {
          color: "#007AFF",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
