import {
  addDoc,
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";

export const SurveyService = {
  // 1. Soruları Getir (Daha Hızlı ve Filtreli)
  async fetchActiveQuestions() {
    try {
      // Filtrelemeyi kod içinde (.filter) değil, veritabanı seviyesinde yapıyoruz.
      // Bu çok daha hızlıdır ve boş dönme ihtimalini azaltır.
      const q = query(
        collection(db, "questions"),
        where("isActive", "==", true),
      );
      const querySnapshot = await getDocs(q);

      console.log(
        "📡 Firestore'dan çekilen ham belge sayısı:",
        querySnapshot.size,
      );

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("🔥 fetchActiveQuestions Hatası:", error);
      throw error;
    }
  },

  // 2. Kullanıcının Bugünkü Anketlerini Getir (Yavaşlığın Ana Sebebi Burası!)
  async getTodaySurveys(userId: string) {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // ⚠️ DİKKAT: userId ve createdAt aynı anda kullanılıyorsa INDEX gerekir.
      const q = query(
        collection(db, "surveys"),
        where("userId", "==", userId),
        where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.data());
    } catch (error: any) {
      // Eğer terminalde hata görmüyorsan, muhtemelen burada takılıyordur.
      console.error("🔥 getTodaySurveys Hatası:", error.message);
      throw error;
    }
  },

  // 3. Anketi Kaydet
  async saveSurveyResults(userId: string, answers: any) {
    try {
      return await addDoc(collection(db, "surveys"), {
        userId,
        answers,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("🔥 saveSurveyResults Hatası:", error);
      throw error;
    }
  },
};
