import {
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    Timestamp,
} from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";

// 🔹 Filtrelenecek (Sansürlenecek) Örnek Şehir ve Özel Kelime Listesi
const FORBIDDEN_WORDS = [
  "istanbul",
  "ankara",
  "izmir",
  "antalya",
  "bursa",
  "adana",
  "sokak",
  "cadde",
  "mahallesi",
  "no:",
  "telefon",
  "05",
];

export const PostService = {
  // 🚀 Yeni Paylaşım Oluştur (Sansür Mekanizmalı)
  async createPost(userId: string, text: string) {
    const username = `User#${userId.substring(0, 6)}`; // userId'nin ilk 6 hanesi

    // 🛡️ Kural Tabanlı Filtreleme (Censorship)
    let filteredText = text;
    FORBIDDEN_WORDS.forEach((word) => {
      const regex = new RegExp(word, "gi"); // Büyük/küçük harf duyarsız
      filteredText = filteredText.replace(regex, "*******");
    });

    return await addDoc(collection(db, "posts"), {
      userId,
      username,
      text: filteredText,
      createdAt: Timestamp.now(),
    });
  },

  // 📥 Tüm Paylaşımları Getir (En yeni en üstte)
  async fetchPosts() {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  },
};
