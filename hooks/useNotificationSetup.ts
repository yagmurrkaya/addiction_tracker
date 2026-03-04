import * as Device from "expo-device";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Alert } from "react-native";

// 📣 Bildirim davranışı (alert + ses + banner)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotificationSetup() {
  useEffect(() => {
    const requestPermissions = async () => {
      if (!Device.isDevice) {
        Alert.alert(
          "Uyarı",
          "Bildirimler sadece fiziksel cihazlarda çalışır 📱",
        );
        return;
      }

      try {
        // 🔹 Bildirim izin durumunu al
        const settings = await Notifications.getPermissionsAsync();

        // 🔹 iOS’ta tekrar sormak istersen:
        // Eğer izin verilmediyse doğrudan tekrar iste
        if (settings.status !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();

          if (status !== "granted") {
            Alert.alert(
              "Bildirim İzni Gerekli",
              "Bildirim almak için izin vermelisin.",
              [
                { text: "Ayarları Aç", onPress: () => Linking.openSettings() },
                { text: "İptal", style: "cancel" },
              ],
            );
          } else {
            console.log("✅ Bildirim izni verildi");
          }
        } else {
          console.log("ℹ️ Bildirim izni zaten verilmiş");
        }
      } catch (err) {
        console.error("❌ Bildirim izni alınamadı:", err);
      }
    };

    requestPermissions();
  }, []);
}
