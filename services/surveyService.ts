import {
    addDoc,
    collection,
    getDocs,
    query,
    Timestamp,
    where,
} from "firebase/firestore";
import { db } from "../app/firebase/firebaseConfig"; // Mevcut config yolun

export const SurveyService = {
  // Soruları Getir
  async fetchActiveQuestions() {
    const querySnapshot = await getDocs(collection(db, "questions"));
    return querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((q: any) => q.isActive === true);
  },

  // Kullanıcının Bugünkü Anketlerini Getir
  async getTodaySurveys(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "surveys"),
      where("userId", "==", userId),
      where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  // Anketi Kaydet
  async saveSurveyResults(userId: string, answers: any) {
    return await addDoc(collection(db, "surveys"), {
      userId,
      answers,
      createdAt: Timestamp.now(),
    });
  },
};
