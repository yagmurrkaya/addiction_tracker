import AsyncStorage from "@react-native-async-storage/async-storage";
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

import QuestionCard from "../components/QuestionCard";
import { COLORS } from "../constants/Colors";
import useAnonymousId from "../hooks/useAnonymousId";
import { SurveyService } from "../services/surveyService";
import { validateAllAnswered } from "../utils/surveyLogic";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // 👈 Hata mesajı için

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        console.log("📡 1. Firebase'den sorular isteniyor...");
        const fetched = await SurveyService.fetchActiveQuestions();

        console.log("📡 2. Firebase Yanıtı Geldi:", fetched);

        if (!fetched || fetched.length === 0) {
          console.log("⚠️ 3. Uyarı: Hiç soru bulunamadı!");
          setErrorMessage(
            "Şu an aktif soru bulunmuyor. Lütfen veritabanını kontrol edin.",
          );
        } else {
          console.log(
            "✅ 4. Sorular başarıyla yüklendi. Sayı:",
            fetched.length,
          );
          setQuestions(fetched as Question[]);
        }
      } catch (error: any) {
        console.error("🔥 ❌ SORU YÜKLEME HATASI:", error);
        setErrorMessage(
          "Bağlantı hatası: " + (error.message || "Bilinmeyen hata"),
        );
        Alert.alert("Hata", "Sorular yüklenirken bir sorun oluştu.");
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
      await SurveyService.saveSurveyResults(userId, answers);
      await AsyncStorage.setItem(
        `last_survey_${userId}`,
        Date.now().toString(),
      );

      Alert.alert("Başarılı 💙", "Cevaplarınız kaydedildi.", [
        { text: "Tamam", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      Alert.alert("Hata", "Kaydedilirken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Yükleme Ekranı
  if (fetching) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.text }}>
          Sorular getiriliyor...
        </Text>
      </View>
    );
  }

  // ❌ Hata veya Boş Ekran Durumu
  if (errorMessage) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ textAlign: "center", fontSize: 16, marginBottom: 20 }}>
          {errorMessage}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: COLORS.primary,
            padding: 15,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Geri Dön</Text>
        </TouchableOpacity>
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
