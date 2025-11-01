import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { addDoc, collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import useAnonymousId from "../hooks/useAnonymousId";
import { db } from "./firebase/firebaseConfig";

// 🔹 Firestore’daki question dokümanlarının tipi
type Question = {
  id: string;
  questionText: string;
  type: string; // "single", "multi", "slider"
  options?: string[];
  isActive: boolean;
};

// 🔹 Ana bileşen
export default function SurveyScreen() {
  const router = useRouter();
  const userId = useAnonymousId();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false); // 🔹 Tekrar tıklamayı önlemek için

  // 🔹 Firestore’dan soruları çek
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "questions"));
        const fetched = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((q: any) => q.isActive === true);

        setQuestions(fetched as Question[]);
      } catch (error) {
        console.error("Soru çekme hatası:", error);
      }
    };
    fetchQuestions();
  }, []);

  // 🔹 Cevapları güncelle
  const handleAnswer = (id: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // 🔹 Anketi gönder
  const submit = async () => {
    if (loading) return; // tekrar tıklama engeli
    setLoading(true);

    if (!userId) {
      Alert.alert("Yükleniyor", "Kullanıcı kimliği alınamadı. Lütfen tekrar deneyin.");
      setLoading(false);
      return;
    }

    // 🔹 Tüm aktif soruların cevaplandığını kontrol et
    const allAnswered = questions.every((q) => {
      const ans = answers[q.id];
      return ans !== undefined && ans !== null && ans !== "" && !(Array.isArray(ans) && ans.length === 0);
    });

    if (!allAnswered) {
      Alert.alert("Uyarı", "Lütfen tüm sorulara cevap veriniz.");
      setLoading(false);
      return;
    }

    try {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      // 🔹 Kullanıcının bugünkü doldurduğu anketleri al
      const q = query(
        collection(db, "surveys"),
        where("userId", "==", userId),
        where("createdAt", ">=", Timestamp.fromDate(startOfDay))
      );
      const snapshot = await getDocs(q);
      const surveysToday = snapshot.docs.map(doc => doc.data());
      const surveysCount = surveysToday.length;

      // 🔹 Günlük limit kontrolü
      if (surveysCount >= 3) {
        Alert.alert("Uyarı", "Günlük anket doldurma hakkınız doldu.");
        setLoading(false);
        return;
      }

      // 🔹 1 saat bekleme kontrolü
      if (surveysToday.length > 0) {
        const lastSurvey: any = surveysToday[surveysToday.length - 1];
        const lastTime = lastSurvey.createdAt.toDate();
        const diffMinutes = (now.getTime() - lastTime.getTime()) / (1000 * 60);

        if (diffMinutes < 60) {
          const remaining = Math.ceil(60 - diffMinutes);
          Alert.alert("Uyarı", `Anketi tekrar doldurmanız için ${remaining} dakika beklemelisiniz.`);
          setLoading(false);
          return;
        }
      }

      // 🔹 Anketi kaydet
      await addDoc(collection(db, "surveys"), {
        userId,
        answers,
        createdAt: Timestamp.now(),
      });

      Alert.alert("Teşekkürler 💙", "Cevaplarınız anonim olarak kaydedildi.");
      setAnswers({});
      router.push("/");
    } catch (error) {
      console.error("Veri kaydetme hatası:", error);
      Alert.alert("Hata", "Veriler kaydedilirken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 UI
  return (
    <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        Günlük Duygu ve Madde Kullanımı Anketi
      </Text>

      {questions.map((q) => (
        <View key={q.id} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>{q.questionText}</Text>

          {/* Tekli cevap (single) */}
          {q.type === "single" && q.options?.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => handleAnswer(q.id, opt)}
              style={{
                backgroundColor: answers[q.id] === opt ? "#007AFF" : "#E5E5E5",
                padding: 10,
                borderRadius: 10,
                marginVertical: 4,
              }}
            >
              <Text style={{ color: answers[q.id] === opt ? "white" : "black" }}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Çoklu cevap (multi) */}
          {q.type === "multi" && q.options?.map((opt) => {
            const selected = answers[q.id]?.includes(opt);
            const isNoneOption = opt.toLowerCase().includes("hiçbiri");

            return (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  let updated: string[] = answers[q.id] || [];

                  if (isNoneOption) {
                    // 🔹 Eğer "Hiçbiri" seçildiyse → diğerlerini temizle, sadece o kalsın
                    updated = selected ? [] : [opt];
                  } else {
                    // 🔹 Eğer başka bir seçenek seçildiyse → "Hiçbiri"yi kaldır
                    updated = updated.filter((x) => x.toLowerCase() !== "hiçbiri");

                    if (selected) {
                      updated = updated.filter((x) => x !== opt);
                    } else {
                      updated.push(opt);
                    }
                  }

                  handleAnswer(q.id, updated);
                }}
                style={{
                  backgroundColor: selected ? "#007AFF" : "#E5E5E5",
                  padding: 10,
                  borderRadius: 10,
                  marginVertical: 4,
                }}
              >
                <Text style={{ color: selected ? "white" : "black" }}>{opt}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Slider (craving düzeyi) */}
          {q.type === "slider" && (
            <>
              <Slider
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={answers[q.id] || 0}
                onValueChange={(v) => handleAnswer(q.id, v)}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#ddd"
                thumbTintColor="#007AFF"
                style={{ marginVertical: 12 }}
              />
              <Text style={{ textAlign: "center" }}>
                Seçilen düzey: {answers[q.id] || "—"}
              </Text>
            </>
          )}
        </View>
      ))}

      {/* Gönder butonu */}
      <TouchableOpacity
        onPress={submit}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#999" : "#007AFF",
          padding: 14,
          borderRadius: 10,
          marginTop: 24,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
          {loading ? "Kaydediliyor..." : "Gönder"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
