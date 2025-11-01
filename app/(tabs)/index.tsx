import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import SurveyButton from "../../components/SurveyButton";
import useAnonymousId from "../../hooks/useAnonymousId";
import { scheduleSurveyReminders } from "../../hooks/useSurveyReminders";

export default function HomeScreen() {
  const userId = useAnonymousId();
  const plannedRef = useRef(false); // 🔹 sadece ilk defa çalıştırmak için

  useEffect(() => {
    const planRemindersOnce = async () => {
      if (!userId || plannedRef.current) return; // tekrar çalışmayı engelle
      plannedRef.current = true;

      try {
        console.log("🧠 Kullanıcı ID bulundu:", userId);
        await scheduleSurveyReminders(userId);
      } catch (err) {
        console.error("Bildirim planlama hatası:", err);
      }
    };

    planRemindersOnce();
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Addiction Tracker</Text>
      <Text style={styles.subtitle}>
        Günlük duygu ve madde kullanım anketine hoş geldin!
      </Text>

      <SurveyButton />
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
  },
});
