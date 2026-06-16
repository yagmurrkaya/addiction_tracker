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

let isPlanning = false;

const MAX_DAILY_REMINDERS = 3;

// Kullanıcı uygulamayı açtıktan sonra ilk bildirim en erken kaç dakika sonra gelsin?
const MIN_FIRST_NOTIFICATION_DELAY_MINUTES = 2; // 2 saat

const START_MINUTE = 10 * 60; // 10:00
const END_MINUTE = 22 * 60; // 22:00

const getDateKey = (date: Date) => {
  return date.toISOString().split("T")[0];
};

const formatMinute = (m: number) =>
  `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, "0")}`;

const clearReminderStorage = async (
  planKey: string,
  idsKey: string,
  timesKey: string,
) => {
  await AsyncStorage.removeItem(planKey);
  await AsyncStorage.removeItem(idsKey);
  await AsyncStorage.removeItem(timesKey);
};

const getRandomTimesInRange = (
  startMinute: number,
  endMinute: number,
  count: number,
) => {
  const times: number[] = [];

  if (endMinute - startMinute < 60) {
    return times;
  }

  let attempts = 0;

  while (times.length < count && attempts < 200) {
    attempts++;

    const random =
      Math.floor(Math.random() * (endMinute - startMinute)) + startMinute;

    if (times.every((t) => Math.abs(t - random) >= 60)) {
      times.push(random);
    }
  }

  return times.sort((a, b) => a - b);
};

const createTriggerDate = (baseDate: Date, minuteOfDay: number) => {
  const triggerDate = new Date(baseDate);

  const hours = Math.floor(minuteOfDay / 60);
  const minutes = minuteOfDay % 60;

  triggerDate.setHours(hours, minutes, 0, 0);

  return triggerDate;
};

const getPlanDateAndTimes = () => {
  const now = new Date();

  const minAllowedDate = new Date(
    now.getTime() + MIN_FIRST_NOTIFICATION_DELAY_MINUTES * 60 * 1000,
  );

  const minAllowedMinute =
    minAllowedDate.getHours() * 60 + minAllowedDate.getMinutes();

  /**
   * Bugün hâlâ 10:00-22:00 aralığında ve en az 2 saat sonrası uygunsa,
   * bildirimleri bugün kalan zamana planla.
   */
  if (minAllowedMinute < END_MINUTE) {
    const todayStartMinute = Math.max(START_MINUTE, minAllowedMinute);

    const todayTimes = getRandomTimesInRange(
      todayStartMinute,
      END_MINUTE,
      MAX_DAILY_REMINDERS,
    );

    if (todayTimes.length > 0) {
      return {
        planDate: now,
        times: todayTimes,
      };
    }
  }

  /**
   * Bugün uygun zaman kalmadıysa yarına planla.
   */
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    planDate: tomorrow,
    times: getRandomTimesInRange(START_MINUTE, END_MINUTE, MAX_DAILY_REMINDERS),
  };
};

export const scheduleSurveyReminders = async (userId: string) => {
  if (!userId || isPlanning) {
    return { status: "busy_or_no_user" };
  }

  isPlanning = true;

  try {
    const { planDate, times } = getPlanDateAndTimes();

    const planDateKey = getDateKey(planDate);
    const planKey = `reminder_planned_${planDateKey}`;
    const idsKey = `reminder_ids_${planDateKey}`;
    const timesKey = `reminder_times_${planDateKey}`;

    const pendingBefore =
      await Notifications.getAllScheduledNotificationsAsync();

    console.log("📌 Bekleyen bildirim sayısı:", pendingBefore.length);

    /**
     * Eğer cihazda gereğinden fazla bildirim varsa, önce temizle.
     */
    if (pendingBefore.length > MAX_DAILY_REMINDERS) {
      console.log("🧹 Fazla bildirim bulundu. Temizleniyor.");

      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      await clearReminderStorage(planKey, idsKey, timesKey);
    }

    const alreadyPlanned = await AsyncStorage.getItem(planKey);
    const savedIdsRaw = await AsyncStorage.getItem(idsKey);

    /**
     * Plan zaten varsa ve cihazda gerçekten pending olarak duruyorsa tekrar kurma.
     */
    if (alreadyPlanned && savedIdsRaw) {
      const savedIds: string[] = JSON.parse(savedIdsRaw);

      const pendingNotifications =
        await Notifications.getAllScheduledNotificationsAsync();

      const matchedPending = pendingNotifications.filter((notification) =>
        savedIds.includes(notification.identifier),
      );

      if (
        matchedPending.length > 0 &&
        matchedPending.length <= MAX_DAILY_REMINDERS
      ) {
        const savedTimes = await AsyncStorage.getItem(timesKey);

        console.log(
          "📅 Bildirimler zaten planlı.",
          savedTimes
            ? `🕒 Saatler: ${JSON.parse(savedTimes)
                .map((m: number) => formatMinute(m))
                .join(", ")}`
            : "",
        );

        return {
          status: "already_planned",
          count: matchedPending.length,
        };
      }
    }

    /**
     * Temiz planlama yap.
     */
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
    await clearReminderStorage(planKey, idsKey, timesKey);

    /**
     * Bugün kaç anket doldurulduğunu kontrol et.
     */
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "surveys"),
      where("userId", "==", userId),
      where("createdAt", ">=", Timestamp.fromDate(startOfToday)),
    );

    const snapshot = await getDocs(q);

    if (snapshot.docs.length >= MAX_DAILY_REMINDERS) {
      console.log("🎯 Günlük anket limiti dolmuş. Bildirim kurulmadı.");

      await AsyncStorage.setItem(planKey, "true");

      return {
        status: "limit_reached",
      };
    }

    const scheduledIds: string[] = [];
    const scheduledTimes: number[] = [];

    for (const t of times) {
      const triggerDate = createTriggerDate(planDate, t);

      /**
       * Güvenlik kontrolü:
       * Şu andan önce veya şu ana çok yakınsa planlama.
       */
      const minimumSafeTime =
        Date.now() + MIN_FIRST_NOTIFICATION_DELAY_MINUTES * 60 * 1000;

      if (triggerDate.getTime() < minimumSafeTime) {
        console.log(`⏭️ Çok yakın/geçmiş saat atlandı: ${formatMinute(t)}`);
        continue;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧠 Anket Hatırlatması",
          body: "Bugünün anketini doldurmayı unutma!",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          channelId: "default",
          date: triggerDate,
        } as Notifications.DateTriggerInput,
      });

      scheduledIds.push(notificationId);
      scheduledTimes.push(t);
    }

    await AsyncStorage.setItem(planKey, "true");
    await AsyncStorage.setItem(idsKey, JSON.stringify(scheduledIds));
    await AsyncStorage.setItem(timesKey, JSON.stringify(scheduledTimes));

    console.log(
      `✅ Bildirimler ${planDateKey} için planlandı:`,
      scheduledTimes.length > 0
        ? scheduledTimes.map(formatMinute).join(", ")
        : "Uygun saat bulunamadı.",
    );

    return {
      status: "planned",
      date: planDateKey,
      count: scheduledIds.length,
    };
  } catch (error) {
    console.error("❌ Bildirim planlama hatası:", error);

    return {
      status: "error",
    };
  } finally {
    isPlanning = false;
  }
};
