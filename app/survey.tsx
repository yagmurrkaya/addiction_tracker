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
import {
  getRemainingCooldown,
  validateAllAnswered,
} from "../utils/surveyLogic";

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

  // 🔹 Veri yükleme mantığı
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const fetched = await SurveyService.fetchActiveQuestions();
        setQuestions(fetched as Question[]);
      } catch (error: any) {
        console.error("🔥 HATA:", error.message);
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

    if (!validateAllAnswered(questions, answers)) {
      Alert.alert("Uyarı", "Lütfen tüm sorulara cevap veriniz.");
      return;
    }

    setLoading(true);
    try {
      const surveysToday = await SurveyService.getTodaySurveys(userId);

      // Günlük Limit Kontrolü
      if (surveysToday.length >= 3) {
        Alert.alert("Limit Doldu", "Günde en fazla 3 anket doldurabilirsiniz.");
        setLoading(false);
        return;
      }

      // Saatlik Kontrol
      if (surveysToday.length > 0) {
        const lastSurvey = surveysToday[surveysToday.length - 1] as any;
        const remaining = getRemainingCooldown(lastSurvey.createdAt.toDate());
        if (remaining > 0) {
          Alert.alert(
            "Bekleyiniz",
            `Yeni anket için ${remaining} dakika beklemelisiniz.`,
          );
          setLoading(false);
          return;
        }
      }

      await SurveyService.saveSurveyResults(userId, answers);

      // ✅ DEĞİŞİKLİK BURADA: router.push yerine router.back() kullanıyoruz
      Alert.alert("Başarılı 💙", "Cevaplarınız kaydedildi.", [
        {
          text: "Tamam",
          onPress: () => {
            if (router.canGoBack()) {
              router.back(); // Anket sayfasını kapatır ve geldiği yere (index) döner
            } else {
              router.replace("/(tabs)"); // Eğer geri gidemiyorsa ana tab yapısına zorla gönderir
            }
          },
        },
      ]);
    } catch (error) {
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
