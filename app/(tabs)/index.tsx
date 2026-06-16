import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useAnonymousId from "../../hooks/useAnonymousId";
//import { scheduleSurveyReminders } from "../../hooks/useSurveyReminders";
import { SurveyService } from "../../services/surveyService";
import { getRemainingCooldown } from "../../utils/surveyLogic";

export default function HomeScreen() {
  const router = useRouter();
  const userId = useAnonymousId();
  const [checking, setChecking] = useState(false);
  const [localCooldown, setLocalCooldown] = useState(0);
  const plannedRef = useRef(false);

  // Sayfa her odaklandığında bekleme süresini kontrol et
  useFocusEffect(
    useCallback(() => {
      const checkLocalStatus = async () => {
        if (!userId) return;
        const lastLocalSurvey = await AsyncStorage.getItem(
          `last_survey_${userId}`,
        );
        if (lastLocalSurvey) {
          const lastDate = new Date(parseInt(lastLocalSurvey));
          const remaining = getRemainingCooldown(lastDate);
          setLocalCooldown(remaining);
        }
      };
      checkLocalStatus();
    }, [userId]),
  );

  useEffect(() => {
    if (userId && !plannedRef.current) {
      plannedRef.current = true;
      //scheduleSurveyReminders(userId);
    }
  }, [userId]);

  // Bildirim Kanalı Test Butonu (Hala lazım olabilir diye tuttum)
  const triggerInstantTest = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Yerel Test ✅",
          body: "Bildirim kanalı aktif!",
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleStartSurvey = async () => {
    if (!userId) {
      Alert.alert("Bekleyiniz", "Kullanıcı kimliği hazırlanıyor...");
      return;
    }

    setChecking(true);

    try {
      // 1️⃣ Yerel Süre Kontrolü
      if (localCooldown > 0) {
        Alert.alert(
          "Bekleme Süresi",
          ` ${localCooldown} dakika sonra tekrar deneyebilirsiniz.`,
        );
        setChecking(false);
        return;
      }

      // 2️⃣ Firestore Kontrolü
      const surveysToday = await SurveyService.getTodaySurveys(userId);

      if (surveysToday.length >= 3) {
        Alert.alert("Limit Doldu", "Günde en fazla 3 anket doldurabilirsiniz.");
        setChecking(false);
        return;
      }

      router.push("/survey");
    } catch (error) {
      console.error("Hata:", error);
      Alert.alert("Hata", "Bağlantı sorunu oluştu.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Addiction Tracker</Text>
      <Text style={styles.subtitle}>İyileşme yolculuğunda bugün nasılsın?</Text>

      {/* 🔘 Orijinal Buton Yapısı */}
      <TouchableOpacity
        style={[styles.button, checking && { backgroundColor: "#ccc" }]}
        onPress={handleStartSurvey}
        disabled={checking} // Sadece kontrol anında pasif olur
      >
        {checking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Anketi Doldur</Text>
        )}
      </TouchableOpacity>

      {/* Bildirim test butonunu artık gizliyoruz:
      <TouchableOpacity onPress={triggerInstantTest} style={styles.miniTestBtn}>
        <Text style={styles.miniTestText}>Bildirimi Test Et</Text>
      </TouchableOpacity> 
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 20,
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 10 },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 3,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  miniTestBtn: { marginTop: 50, opacity: 0.5 },
  miniTestText: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "underline",
  },
});
