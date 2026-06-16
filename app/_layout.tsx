import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as TaskManager from "expo-task-manager";
import { useEffect, useRef } from "react";

import useAnonymousId from "../hooks/useAnonymousId";
import { useNotificationSetup } from "../hooks/useNotificationSetup";
import { scheduleSurveyReminders } from "../hooks/useSurveyReminders";

const LOCATION_TASK_NAME = "RISKY_ZONE_TASK";

const taskExecutor: any = async ({ data, error }: any) => {
  if (error) {
    console.error("Geofencing Hatası:", error);
    return;
  }

  if (data && data.eventType === Location.GeofencingEventType.Enter) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Farkındalık Bildirimi 🌿",
        body: "Senin için riskli bir bölgedesin, iyi misin?",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  }
};

TaskManager.defineTask(LOCATION_TASK_NAME, taskExecutor);

export default function RootLayout() {
  const userId = useAnonymousId();

  // Aynı app oturumunda tekrar tekrar planlamayı engeller
  const reminderScheduledRef = useRef(false);

  useNotificationSetup();

  useEffect(() => {
    if (!userId) return;

    if (reminderScheduledRef.current) {
      console.log("⏭️ Bildirim planlama bu oturumda zaten çalıştı.");
      return;
    }

    reminderScheduledRef.current = true;

    console.log(
      "🔥 Bildirim planlama RootLayout içinde çalıştı. userId:",
      userId,
    );

    scheduleSurveyReminders(userId);
  }, [userId]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

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

      <Stack.Screen
        name="add-risky-location"
        options={{
          title: "Riskli Bölge Seç",
          headerShown: true,
          presentation: "card",
          headerBackTitle: "Geri",
        }}
      />
    </Stack>
  );
}
