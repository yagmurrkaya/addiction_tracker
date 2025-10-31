/*
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

export default function useAnonymousId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadOrCreateId = async () => {
      try {
        // Daha önce oluşturulmuş ID varsa çek
        let storedId = await SecureStore.getItemAsync("anonymous_user_id");

        // Yoksa yeni bir tane oluştur
        if (!storedId) {
          storedId = await Crypto.randomUUID(); // 🔹 Güvenli ve Expo uyumlu
          await SecureStore.setItemAsync("anonymous_user_id", storedId);
        }

        setUserId(storedId);
      } catch (err) {
        console.error("Anonim ID alınamadı:", err);
      }
    };

    loadOrCreateId();
  }, []);

  return userId;
} */

  import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { useEffect, useState } from "react";

export default function useAnonymousId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadOrCreate = async () => {
      let id = await SecureStore.getItemAsync("anonymous_user_id");
      if (!id) {
        id = await Crypto.randomUUID();
        await SecureStore.setItemAsync("anonymous_user_id", id);
      }
      setUserId(id);
    };
    loadOrCreate();
  }, []);

  return userId;
}