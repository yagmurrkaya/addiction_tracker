import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as TaskManager from "expo-task-manager";
import { useEffect } from "react";

// 🔹 Hooks ve Servisler
import useAnonymousId from "../hooks/useAnonymousId";
import { useNotificationSetup } from "../hooks/useNotificationSetup";
import { scheduleSurveyReminders } from "../hooks/useSurveyReminders";

// // 🚀 ARKA PLAN GÖREVİ TANIMLAMASI (Burası fonksiyonun dışında olmalı!)
// const LOCATION_TASK_NAME = "RISKY_ZONE_TASK";

// TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }: any) => {
//   if (error) {
//     console.error("Geofencing Hatası:", error);
//     return;
//   }

//   // Kullanıcı riskli bir bölgeye giriş yaptığında tetiklenir
//   if (data.eventType === Location.GeofencingEventType.Enter) {
//     Notifications.scheduleNotificationAsync({
//       content: {
//         title: "Farkındalık Bildirimi 🌿",
//         body: "Senin için riskli bir bölgedesin, iyi misin?",
//         sound: true,
//         priority: Notifications.AndroidPriority.HIGH,
//       },
//       trigger: null,
//     });
//   }
// });

// 🚀 ARKA PLAN GÖREVİ TANIMLAMASI
// 🚀 ARKA PLAN GÖREVİ TANIMLAMASI
const LOCATION_TASK_NAME = "RISKY_ZONE_TASK";

// TypeScript'in parametre hatasını gidermek için 'any' tipini fonksiyonun kendisine atıyoruz
const taskExecutor: any = async ({ data, error }: any) => {
  if (error) {
    console.error("Geofencing Hatası:", error);
    return;
  }

  // Kullanıcı riskli bir bölgeye giriş yaptığında tetiklenir (Enter = 1)
  if (data && data.eventType === Location.GeofencingEventType.Enter) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Farkındalık Bildirimi 🌿",
        body: "Senin için riskli bir bölgedesin, iyi misin?",
        sound: true,
        // SDK 54'te 'AndroidPriority' yerine 'AndroidNotificationPriority' kullanılır
        priority: Notifications.AndroidNotificationPriority?.HIGH || "high",
      },
      trigger: null,
    });
  }
};

TaskManager.defineTask(LOCATION_TASK_NAME, taskExecutor);

export default function RootLayout() {
  const userId = useAnonymousId();

  // 1️⃣ Global Bildirim ve ID Ayarları
  useNotificationSetup();

  useEffect(() => {
    if (userId) {
      scheduleSurveyReminders(userId);
    }
  }, [userId]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 🔹 1. ANA YAPI (SEKMELER) */}
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

      {/* 🔹 2. BAĞIMSIZ ANKET SAYFASI */}
      <Stack.Screen
        name="survey"
        options={{
          title: "Günlük Değerlendirme",
          headerShown: true,
          presentation: "modal",
          headerBackTitle: "Vazgeç",
          headerShadowVisible: false,
        }}
      />

      {/* 🔹 3. RİSKLİ KONUM EKLEME SAYFASI */}
      <Stack.Screen
        name="add-risky-location"
        options={{
          title: "Riskli Bölge Seç",
          headerShown: true,
          presentation: "card", // Normal sayfa geçişi
          headerBackTitle: "Geri",
        }}
      />
    </Stack>
  );
}
