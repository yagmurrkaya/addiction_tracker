import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router"; // 👈 useFocusEffect eklendi
import React, { useCallback, useEffect, useRef, useState } from "react"; // 👈 useCallback eklendi
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
  const [localCooldown, setLocalCooldown] = useState(0); // 👈 Yerel süreyi takip etmek için
  const plannedRef = useRef(false);

  // 🚀 SAYFA HER ODAKLANDIĞINDA (Geri gelindiğinde dahil) KONTROL ET
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
      scheduleSurveyReminders(userId);
    }
  }, [userId]);

  const handleStartSurvey = async () => {
    if (!userId) {
      Alert.alert("Bekleyiniz", "Kullanıcı kimliği hazırlanıyor...");
      return;
    }

    setChecking(true);

    try {
      // 1️⃣ ÖNCE YEREL STATE KONTROLÜ (En hızlısı)
      if (localCooldown > 0) {
        Alert.alert(
          "Bekleme Süresi",
          `Çok yeni bir anket doldurdunuz. ${localCooldown} dakika sonra tekrar deneyebilirsiniz.`,
        );
        setChecking(false);
        return;
      }

      // 2️⃣ FİRESTORE KONTROLÜ (Yedek ve günlük limit için)
      const surveysToday = await SurveyService.getTodaySurveys(userId);

      if (surveysToday.length >= 3) {
        Alert.alert("Limit Doldu", "Günde en fazla 3 anket doldurabilirsiniz.");
        setChecking(false);
        return;
      }

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

      router.push("/survey");
    } catch (error) {
      console.error("Hata:", error);
      Alert.alert("Hata", "Kontrol yapılırken bir sorun oluştu.");
    } finally {
      setChecking(false);
    }
  };

  // Butonun devre dışı kalma mantığı
  const isButtonDisabled = checking || localCooldown > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Addiction Tracker</Text>
      <Text style={styles.subtitle}>İyileşme yolculuğunda bugün nasılsın?</Text>

      <TouchableOpacity
        style={[styles.button, isButtonDisabled && { backgroundColor: "#ccc" }]}
        onPress={handleStartSurvey}
        disabled={isButtonDisabled}
      >
        {checking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {localCooldown > 0 ? "Bekleme Modu" : "Anketi Doldur"}
          </Text>
        )}
      </TouchableOpacity>

      {localCooldown > 0 && (
        <Text style={{ marginTop: 10, color: "#ff3b30" }}>
          Kalan süre: {localCooldown} dk
        </Text>
      )}
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
