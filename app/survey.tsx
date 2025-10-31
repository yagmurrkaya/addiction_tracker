import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { addDoc, collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import useAnonymousId from "../hooks/useAnonymousId";
import { db } from "./firebase/firebaseConfig"; // ✅ DÜZELTİLDİ

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

  // 🔹 Firestore’dan soruları çek
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "questions"));
        const fetched = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() })) // tüm alanları al
          .filter((q: any) => q.isActive === true); // sadece aktif sorular

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
  /*const submit = async () => {
    // Tüm aktif sorular cevaplanmış mı?
    const allAnswered = questions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) {
      Alert.alert("Uyarı", "Lütfen tüm soruları cevaplayın.");
      return;
    }

    try {
      await addDoc(collection(db, "surveys"), {
        answers,
        createdAt: Timestamp.now(),
      });
      Alert.alert("Teşekkürler 💙", "Cevaplarınız anonim olarak kaydedildi.");
      setAnswers({});
    } catch (error) {
      console.error("Veri kaydetme hatası:", error);
      Alert.alert("Hata", "Veriler kaydedilirken bir sorun oluştu.");
    }
  }; */

  const submit = async () => {
  if (!userId) {
    Alert.alert("Yükleniyor", "Kullanıcı kimliği alınamadı. Lütfen tekrar deneyin.");
    return;
  }

  if (!answers || Object.keys(answers).length === 0) {
    Alert.alert("Uyarı", "Lütfen tüm soruları cevaplayın.");
    return;
  }

  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // 🔹 Sadece bu kullanıcıya ait anketleri al
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
      return;
    }

    // 🔹 1 saat bekleme kontrolü
    if (surveysToday.length > 0) {
      const lastSurvey: any = surveysToday[surveysToday.length - 1];
      const lastTime = lastSurvey.createdAt.toDate();
      const diffMinutes = (now.getTime() - lastTime.getTime()) / (1000 * 60);

      if (diffMinutes < 60) {
        Alert.alert(
          "Uyarı",
          "Anketi doldurmanız için önceki doldurmanızdan itibaren 1 saat beklemeniz gerekmektedir."
        );
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
          {q.type === "single" && q.options && q.options.map((opt) => (
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
          {q.type === "multi" && q.options && q.options.map((opt) => {
            const selected = answers[q.id]?.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  const prev = answers[q.id] || [];
                  const updated = selected
                    ? prev.filter((x: string) => x !== opt)
                    : [...prev, opt];
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
        style={{
          backgroundColor: "#007AFF",
          padding: 14,
          borderRadius: 10,
          marginTop: 24,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
          Gönder
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}