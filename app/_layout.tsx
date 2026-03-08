import { Stack } from "expo-router";
import { useEffect } from "react";

// 🔹 Klasörleri dışarı taşıdığımız için import yollarını güncelliyoruz
// Not: Eğer tsconfig.json'da "@" takısı tanımlı değilse "../hooks/..." şeklinde kullanmalısın
import useAnonymousId from "../hooks/useAnonymousId";
import { useNotificationSetup } from "../hooks/useNotificationSetup";
import { scheduleSurveyReminders } from "../hooks/useSurveyReminders";

export default function RootLayout() {
  const userId = useAnonymousId();

  // 1️⃣ Bildirim izinlerini ayarlıyoruz
  useNotificationSetup();

  // 2️⃣ Günlük bildirimleri planlıyoruz
  useEffect(() => {
    if (userId) {
      scheduleSurveyReminders(userId);
    }
  }, [userId]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 🔹 Ana sekmeli yapı */}
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

      {/* 🔹 Anket Sayfası Ayarları */}
      {/* Eğer uyarı devam ederse 'name' kısmının dosya adıyla (survey.tsx) 
          birebir aynı (küçük/büyük harf dahil) olduğundan emin ol */}
      <Stack.Screen
        name="survey"
        options={{
          title: "Anket", // Header'da görünecek yazı (title: "" yaparsan boş görünür)
          headerShown: true, // Geri butonunun görünmesi için true olmalı
          headerBackVisible: true,
          headerShadowVisible: false, // Daha temiz bir görüntü için gölgeyi kaldırdık
        }}
      />
    </Stack>
  );
}
