import AsyncStorage from "@react-native-async-storage/async-storage"; // 👈 Yerel hafıza için ekledik
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useAnonymousId from "../../hooks/useAnonymousId";
import { scheduleSurveyReminders } from "../../hooks/useSurveyReminders";
import { SurveyService } from "../../services/surveyService";
import { getRemainingCooldown } from "../../utils/surveyLogic";

export default function HomeScreen() {
  const router = useRouter();
  const userId = useAnonymousId();
  const [checking, setChecking] = useState(false);
  const plannedRef = useRef(false);

  useEffect(() => {
    if (userId && !plannedRef.current) {
      plannedRef.current = true;
      scheduleSurveyReminders(userId);
    }
  }, [userId]);

  const handleStartSurvey = async () => {
    if (!userId) return;
    setChecking(true);

    try {
      // 1️⃣ YEREL KONTROL (Firestore gecikmesine karşı koruma)
      const lastLocalSurvey = await AsyncStorage.getItem(
        `last_survey_${userId}`,
      );
      if (lastLocalSurvey) {
        const lastDate = new Date(parseInt(lastLocalSurvey));
        const localRemaining = getRemainingCooldown(lastDate);

        if (localRemaining > 0) {
          Alert.alert(
            "Bekleme Süresi",
            `Çok yeni bir anket doldurdunuz. ${localRemaining} dakika sonra tekrar deneyebilirsiniz.`,
          );
          setChecking(false);
          return;
        }
      }

      // 2️⃣ FİRESTORE KONTROLÜ (Genel limit ve diğer cihazlar için)
      const surveysToday = await SurveyService.getTodaySurveys(userId);

      // Günlük 3 limit kontrolü
      if (surveysToday.length >= 3) {
        Alert.alert("Limit Doldu", "Günde en fazla 3 anket doldurabilirsiniz.");
        setChecking(false);
        return;
      }

      // Saatlik cooldown kontrolü
      if (surveysToday.length > 0) {
        const lastSurvey = surveysToday[surveysToday.length - 1] as any;
        const remaining = getRemainingCooldown(lastSurvey.createdAt.toDate());
        if (remaining > 0) {
          Alert.alert(
            "Bekleme Süresi",
            `${remaining} dakika sonra tekrar deneyebilirsiniz.`,
          );
          setChecking(false);
          return;
        }
      }

      // ✅ TÜM KONTROLLER GEÇTİ
      router.push("/survey");
    } catch (error) {
      console.error("Hata:", error);
      Alert.alert("Hata", "Kontrol yapılırken bir sorun oluştu.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Addiction Tracker</Text>
      <Text style={styles.subtitle}>İyileşme yolculuğunda bugün nasılsın?</Text>

      <TouchableOpacity
        style={[styles.button, checking && { backgroundColor: "#ccc" }]}
        onPress={handleStartSurvey}
        disabled={checking}
      >
        {checking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Anketi Doldur</Text>
        )}
      </TouchableOpacity>
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
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
