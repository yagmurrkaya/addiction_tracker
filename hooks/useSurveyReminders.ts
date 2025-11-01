import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "../app/firebase/firebaseConfig";

/**
 * 🔹 10:00 - 22:00 arasında 3 rastgele saat üret (en az 1 saat aralıklı)
 */
const getRandomTimes = () => {
  const times: number[] = [];
  const start = 10 * 60; // 10:00
  const end = 22 * 60;   // 22:00

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
 * - Günlük yalnızca bir kez planlama yapılır
 * - Planlanan saatler console.log’a yazılır
 */
export const scheduleSurveyReminders = async (userId: string) => {
  if (!userId) {
    console.log("⚠️ Bildirim planlaması iptal edildi: userId yok");
    return { status: "no_user" };
  }

  try {
    const todayKey = `reminder_planned_${new Date().toDateString()}`;
    const alreadyPlanned = await AsyncStorage.getItem(todayKey);

    if (alreadyPlanned) {
      // 🔹 Daha önce planlandıysa, son planlanan saatleri de göster
      const savedTimes = await AsyncStorage.getItem("last_planned_times");
      console.log(
        "📅 Bugün için bildirim zaten planlandı, tekrar yapılmadı.",
        savedTimes
          ? `🕒 Planlanan saatler: ${JSON.parse(savedTimes)
              .map((m: number) => `${Math.floor(m / 60)}:${(m % 60)
                .toString()
                .padStart(2, "0")}`)
              .join(", ")}`
          : "(saat bilgisi bulunamadı)"
      );
      return { status: "already_planned" };
    }

    // 🔹 Kullanıcının bugünkü doldurduğu anket sayısını kontrol et
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "surveys"),
      where("userId", "==", userId),
      where("createdAt", ">=", Timestamp.fromDate(startOfDay))
    );

    const snapshot = await getDocs(q);
    const surveysToday = snapshot.docs.map((d) => d.data());
    const count = surveysToday.length;

    if (count >= 3) {
      console.log("🎯 Günlük 3 anket doldurulmuş, yeni bildirim planlanmadı.");
      return { status: "limit_reached" };
    }

    // 🔹 Rastgele 3 saat üret ve planla
    const randomTimes = getRandomTimes();

    for (const t of randomTimes) {
      const hours = Math.floor(t / 60);
      const minutes = t % 60;
      const triggerDate = new Date();
      triggerDate.setHours(hours, minutes, 0, 0);

      // Eğer o saat geçmişse bir sonraki güne ayarla
      if (triggerDate.getTime() < Date.now()) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧠 Anket Hatırlatması",
          body: "Bugünün anketini doldurmayı unutma!",
          sound: true,
        },
        trigger: {
          type: "date",
          date: triggerDate,
        } as Notifications.DateTriggerInput,
      });
    }

    // 🔹 Planlanan saatleri sakla
    await AsyncStorage.setItem(todayKey, "true");
    await AsyncStorage.setItem("last_planned_times", JSON.stringify(randomTimes));

    console.log(
      "✅ Günlük bildirimler planlandı:",
      randomTimes.map((m) => `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, "0")}`).join(", ")
    );

    return { status: "planned" };
  } catch (error) {
    console.error("❌ Bildirim planlama hatası:", error);
    return { status: "error", error };
  }
};
