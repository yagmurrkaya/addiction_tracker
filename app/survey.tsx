import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 🔹 Temiz mimari importları
import QuestionCard from "../components/QuestionCard";
import { COLORS } from "../constants/Colors";
import useAnonymousId from "../hooks/useAnonymousId";
import { SurveyService } from "../services/surveyService";
import { validateAllAnswered } from "../utils/surveyLogic"; // 💡 getRemainingCooldown artık burada gerekmediği için sildik

// 🔹 Tip tanımlaması
type Question = {
  id: string;
  questionText: string;
  type: string;
  options?: string[];
  isActive: boolean;
};

export default function SurveyScreen() {
  const router = useRouter();
  const userId = useAnonymousId();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 🔹 Soruları Firebase'den çekme
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const fetched = await SurveyService.fetchActiveQuestions();
        setQuestions(fetched as Question[]);
      } catch (error: any) {
        console.log("🔥 Soru yükleme hatası:", error);
        Alert.alert("Hata", "Sorular yüklenemedi.");
      } finally {
        setFetching(false);
      }
    };
    loadQuestions();
  }, []);

  const handleAnswer = (id: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const submit = async () => {
    if (loading || !userId) return;

    // ✅ Sadece bu kontrol kalmalı: Boş soru bırakılmasını engeller.
    if (!validateAllAnswered(questions, answers)) {
      Alert.alert("Uyarı", "Lütfen tüm sorulara cevap veriniz.");
      return;
    }

    setLoading(true);
    try {
      // 🚀 BURADAKİ limit ve saatlik kontrolleri HomeScreen'e taşıdığımız için kaldırdık.
      // Artık kullanıcı buraya ulaştıysa doğrudan kaydediyoruz.

      await SurveyService.saveSurveyResults(userId, answers);

      Alert.alert("Başarılı 💙", "Cevaplarınız kaydedildi.", [
        {
          text: "Tamam",
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      Alert.alert("Hata", "Kaydedilirken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "800",
          marginBottom: 25,
          textAlign: "center",
          color: COLORS.text,
        }}
      >
        Günlük Değerlendirme
      </Text>

      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          answer={answers[q.id]}
          onAnswer={handleAnswer}
        />
      ))}

      <TouchableOpacity
        onPress={submit}
        disabled={loading}
        style={{
          backgroundColor: loading ? COLORS.gray : COLORS.primary,
          padding: 18,
          borderRadius: 15,
          marginTop: 10,
          elevation: 3,
        }}
      >
        <Text
          style={{
            color: COLORS.white,
            textAlign: "center",
            fontWeight: "bold",
            fontSize: 18,
          }}
        >
          {loading ? "Kaydediliyor..." : "Anketi Gönder"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
