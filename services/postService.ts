import {
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    Timestamp,
} from "firebase/firestore";
import { ALL_FORBIDDEN_WORDS } from "../constants/forbiddenWords"; // 👈 Listeyi buradan alıyoruz
import { db } from "./firebase/firebaseConfig";

export const PostService = {
  async createPost(userId: string, text: string) {
    const username = `User#${userId.substring(0, 6)}`;
    let filteredText = text;

    // 1️⃣ Kelime Bazlı Filtreleme (İsim, Şehir, Sokak vb.)
    ALL_FORBIDDEN_WORDS.forEach((word) => {
      // \\b kullanımı çok önemli: "Valide" içindeki "ali"yi sansürlemez,
      // sadece tek başına "ali" yazarsa sansürler.
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      filteredText = filteredText.replace(regex, "*******");
    });

    // 2️⃣ Telefon Numarası Filtreleme (Regex)
    // 05xx veya 5xx ile başlayan Türkiye formatındaki numaraları yakalar
    const phoneRegex = /(05|5)[0-9]{2}[- ]?[0-9]{3}[- ]?[0-9]{2}[- ]?[0-9]{2}/g;
    filteredText = filteredText.replace(phoneRegex, "[TELEFON SANSÜRLENDİ]");

    // 3️⃣ Uzun Sayı Dizileri (TC No, Adres No veya Bina No gibi 5 haneden uzun sayılar)
    const numberRegex = /[0-9]{5,}/g;
    filteredText = filteredText.replace(numberRegex, "******");

    return await addDoc(collection(db, "posts"), {
      userId,
      username,
      text: filteredText,
      createdAt: Timestamp.now(),
    });
  },

  async fetchPosts() {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  },
};
