import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase/firebaseConfig";

// 🔐 Çakışmayı önlemek için fonksiyon dışında bir "kilit" değişkeni
let isPlanning = false;

/**
 * 🔹 10:00 - 22:00 arasında 3 rastgele saat üret (en az 1 saat aralıklı)
 */
const getRandomTimes = () => {
  const times: number[] = [];
  const start = 10 * 60; // 10:00
  const end = 22 * 60; // 22:00

  while (times.length < 3) {
    const random = Math.floor(Math.random() * (end - start)) + start;
    if (times.every((t) => Math.abs(t - random) >= 60)) {
      times.push(random);
    }
  }

  return times.sort((a, b) => a - b);
};

/**
 * 🔹 Günlük 3 anket bildirimi planla
 */
export const scheduleSurveyReminders = async (userId: string) => {
  // 1️⃣ Eğer userId yoksa veya şu an zaten bir planlama yapılıyorsa içeri alma
  if (!userId || isPlanning) {
    return { status: "busy_or_no_user" };
  }

  try {
    const todayKey = `reminder_planned_${new Date().toDateString()}`;
    const alreadyPlanned = await AsyncStorage.getItem(todayKey);

    if (alreadyPlanned) {
      const savedTimes = await AsyncStorage.getItem("last_planned_times");
      console.log(
        "📅 Bugünün planı zaten hazır.",
        savedTimes
          ? `🕒 Saatler: ${JSON.parse(savedTimes)
              .map(
                (m: number) =>
                  `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, "0")}`,
              )
              .join(", ")}`
          : "",
      );
      return { status: "already_planned" };
    }

    // 🔒 Kilidi kapatıyoruz (İşlem başladı)
    isPlanning = true;

    // 2️⃣ ESKİ BİLDİRİMLERİ TEMİZLE: Zombi bildirimlerden kurtulmak için şart
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 3️⃣ Bugün kaç anket doldurduğunu kontrol et
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "surveys"),
      where("userId", "==", userId),
      where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
    );

    const snapshot = await getDocs(q);
    if (snapshot.docs.length >= 3) {
      console.log("🎯 Günlük limit dolmuş, bildirim kurulmadı.");
      isPlanning = false; // Kilidi aç
      return { status: "limit_reached" };
    }

    // 4️⃣ Yeni saatleri üret ve planla
    const randomTimes = getRandomTimes();

    for (const t of randomTimes) {
      const hours = Math.floor(t / 60);
      const minutes = t % 60;
      const triggerDate = new Date();
      triggerDate.setHours(hours, minutes, 0, 0);

      if (triggerDate.getTime() < Date.now()) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧠 Anket Hatırlatması",
          body: "Bugünün anketini doldurmayı unutma!",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: triggerDate,
        } as Notifications.DateTriggerInput,
      });
    }

    // 5️⃣ Hafızaya kaydet
    await AsyncStorage.setItem(todayKey, "true");
    await AsyncStorage.setItem(
      "last_planned_times",
      JSON.stringify(randomTimes),
    );

    console.log(
      "✅ Günlük bildirimler planlandı:",
      randomTimes
        .map(
          (m) =>
            `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, "0")}`,
        )
        .join(", "),
    );

    isPlanning = false; // ✅ Kilidi aç (İşlem bitti)
    return { status: "planned" };
  } catch (error) {
    isPlanning = false; // 🔓 Hata durumunda kilidi aç ki tekrar denenebilsin
    console.error("❌ Bildirim planlama hatası:", error);
    return { status: "error" };
  }
};
