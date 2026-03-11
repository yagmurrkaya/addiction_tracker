import { Ionicons } from "@expo/vector-icons"; // İkon için ekledik
import { useRouter } from "expo-router"; // Navigasyon için
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "../constants/Colors";
import useAnonymousId from "../hooks/useAnonymousId";
import { db } from "../services/firebase/firebaseConfig";

export default function MyLocationsScreen() {
  const router = useRouter(); // 👈 Geri gitmek için tanımladık
  const userId = useAnonymousId();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    if (!userId) return;
    try {
      const q = query(
        collection(db, "risky_locations"),
        where("userId", "==", userId),
      );
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLocations(list);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [userId]);

  const deleteLocation = async (locationId: string) => {
    Alert.alert("Emin misin?", "Bu bölgeyi silersen bildirim almayacaksın.", [
      { text: "Vazgeç" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "risky_locations", locationId));
            setLocations((prev) =>
              prev.filter((item) => item.id !== locationId),
            );
            Alert.alert("Başarılı", "Bölge takibi durduruldu.");
          } catch (error) {
            Alert.alert("Hata", "Silinirken bir sorun oluştu.");
          }
        },
      },
    ]);
  };

  if (loading)
    return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      {/* 🔙 ÜST HEADER VE GERİ BUTONU */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()} // 👈 Bir önceki sayfaya döner
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
          <Text style={styles.backText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📍 Kayıtlı Bölgelerim</Text>
      </View>

      {locations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Henüz bir riskli bölge eklemediniz.
          </Text>
        </View>
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationText}>
                  {item.name || "İsimsiz Bölge"}
                </Text>
                <Text style={styles.coordsText}>
                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => deleteLocation(item.id)}
                style={styles.deleteBtn}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Sil</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    paddingTop: 60, // Çentikli telefonlar için boşluk
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    marginLeft: 5,
    color: "#333",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#333",
  },
  card: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationText: { fontWeight: "bold", fontSize: 16, color: "#444" },
  coordsText: { color: "#888", fontSize: 13, marginTop: 4 },
  deleteBtn: {
    backgroundColor: "#FF5252",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#999", fontSize: 16 },
});
