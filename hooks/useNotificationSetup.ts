import * as Device from "expo-device";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Alert, Platform } from "react-native"; // 👈 Platform eklendi

// 📣 Bildirim davranışı (alert + ses + banner)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

export function useNotificationSetup() {
  useEffect(() => {
    const setupNotifications = async () => {
      // 1️⃣ ANDROID KANAL AYARI (Android 8+ için zorunludur, yoksa bildirim görünmez)
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Varsayılan",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      // 2️⃣ EMÜLATÖR TESTİ İÇİN DÜZENLEME
      if (!Device.isDevice) {
        console.log("⚠️ Uyarı: Emülatörde bildirim test ediliyor.");
        // Buradaki Alert ve return kaldırıldı ki emülatörde token alabilesin
      }

      try {
        // 3️⃣ İZİN DURUMUNU KONTROL ET VE İSTE
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          Alert.alert(
            "Bildirim İzni Gerekli",
            "Bildirim almak için izin vermelisin.",
            [
              { text: "Ayarları Aç", onPress: () => Linking.openSettings() },
              { text: "İptal", style: "cancel" },
            ],
          );
          return;
        }

        // 4️⃣ ADRES (TOKEN) LOGLARI - Firebase Console testi için burası lazım
        // Expo üzerinden test için (Expo Push Tool):
        const expoToken = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("🎫 EXPO TOKEN:", expoToken);

        // Firebase Console üzerinden direkt test için (3. Yöntem):
        const fcmToken = (await Notifications.getDevicePushTokenAsync()).data;
        console.log("🔥 FIREBASE (FCM) TOKEN:", fcmToken);
      } catch (err) {
        console.error("❌ Bildirim kurulum hatası:", err);
      }
    };

    setupNotifications();
  }, []);
}
