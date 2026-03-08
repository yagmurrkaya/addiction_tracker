import { useRouter } from "expo-router";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { db } from "../services/firebase/firebaseConfig";

import useAnonymousId from "../hooks/useAnonymousId";

export default function SurveyButton() {
  const router = useRouter();
  const userId = useAnonymousId();

  const handleStartSurvey = async () => {
    if (!userId) {
      Alert.alert(
        "Yükleniyor",
        "Kullanıcı kimliği alınıyor, lütfen tekrar deneyin.",
      );
      return;
    }

    try {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      // Bu kullanıcıya ait bugünkü anketler
      const q = query(
        collection(db, "surveys"),
        where("userId", "==", userId),
        where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
      );
      const snap = await getDocs(q);
      const todayDocs = snap.docs.map((d) => d.data());
      const countToday = todayDocs.length;

      // 1) Günlük 3 limit
      if (countToday >= 3) {
        Alert.alert("Uyarı", "Günlük anket doldurma hakkınız doldu.");
        return;
      }

      // 2) 1 saat bekleme kontrolü + kalan süreyi göster
      if (todayDocs.length > 0) {
        // en son doldurulan (docs doğal sıralı değilse createdAt’e göre en sonu bul)
        const last = todayDocs.reduce((a: any, b: any) =>
          a.createdAt.toMillis() > b.createdAt.toMillis() ? a : b,
        );
        const lastTime = last.createdAt.toDate();
        const diffMin = (now.getTime() - lastTime.getTime()) / (1000 * 60);

        if (diffMin < 60) {
          const remaining = Math.ceil(60 - diffMin);
          Alert.alert(
            "Bekleme Süresi",
            `${remaining} dakika sonra tekrar deneyebilirsiniz.`,
          );
          return;
        }
      }

      // Tüm kontroller geçti → anket ekranına geç
      router.push("/survey");
    } catch (e) {
      console.error(e);
      Alert.alert("Hata", "Kontrol yapılırken bir sorun oluştu.");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity
        onPress={handleStartSurvey}
        style={{ backgroundColor: "#007AFF", padding: 16, borderRadius: 12 }}
      >
        <Text
          style={{ color: "white", textAlign: "center", fontWeight: "700" }}
        >
          🧠 Anketi Doldur
        </Text>
      </TouchableOpacity>
    </View>
  );
}
