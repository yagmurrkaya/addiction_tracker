import useAnonymousId from "@/hooks/useAnonymousId";
import { useNotificationSetup } from "@/hooks/useNotificationSetup";
import { scheduleSurveyReminders } from "@/hooks/useSurveyReminders";
import { Stack } from "expo-router";
import { useEffect } from "react";

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
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          title: "Anasayfa",
          headerShown: false,
        }}
      />

      {/* 🔹 “survey” sayfasında başlığı gizle, geri butonu kalsın */}
      <Stack.Screen
        name="survey"
        options={{
          title: "",
          headerBackVisible: true,
        }}
      />
    </Stack>
  );
}
