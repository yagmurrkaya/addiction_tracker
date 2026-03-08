import { Stack } from "expo-router";
import { useEffect } from "react";

// 🔹 Klasör yolları: Eğer hooks klasörü projenin en dışında (root) ise "../hooks" doğrudur.
import useAnonymousId from "../hooks/useAnonymousId";
import { useNotificationSetup } from "../hooks/useNotificationSetup";
import { scheduleSurveyReminders } from "../hooks/useSurveyReminders";

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
    // headerShown: false yapıyoruz çünkü alt sayfalar kendi başlıklarını yönetecek
    <Stack screenOptions={{ headerShown: false }}>
      {/* 🔹 1. ANA YAPI (SEKMELER) */}
      {/* Anasayfa, Duvar ve Ayarlar bu sekmelerin içinde yaşayacak */}
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

      {/* 🔹 2. BAĞIMSIZ ANKET SAYFASI */}
      {/* Butona basıldığında sekmelerin üstüne, tam ekran olarak açılır */}
      <Stack.Screen
        name="survey"
        options={{
          title: "Günlük Değerlendirme",
          headerShown: true, // Anket sayfasında üst başlık ve geri butonu görünsün
          presentation: "modal", // 👈 iOS'ta aşağıdan yukarıya şık bir şekilde açılır
          headerBackTitle: "Vazgeç",
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
