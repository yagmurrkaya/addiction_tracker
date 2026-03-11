import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import { COLORS } from "../constants/Colors";
import useAnonymousId from "../hooks/useAnonymousId";
import { db } from "../services/firebase/firebaseConfig";

export default function AddRiskyLocationScreen() {
  const router = useRouter();
  const userId = useAnonymousId();

  // 📍 Varsayılan konum: İzmir Bornova Metro (Hızlı açılış için)
  const [region, setRegion] = useState<any>({
    latitude: 38.4601,
    longitude: 27.2123,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [existingLocations, setExistingLocations] = useState<any[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    // 🚀 Paralel yükleme: GPS ve Firebase birbirini beklemez
    const initializeData = async () => {
      await Promise.all([fetchLocation(), fetchFirebaseData()]);
      setDataLoaded(true);
    };

    if (userId) {
      initializeData();
    }
  }, [userId]);

  // 1️⃣ Konumu Şimşek Hızında Al (Last Known)
  const fetchLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      // Önce son bilinen konumu al (Saniyeler sürer)
      let location = await Location.getLastKnownPositionAsync({});

      // Yoksa düşük hassasiyetle hemen sorgula
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
      }

      if (location) {
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (e) {
      console.log("📍 Konum alma pas geçildi (Varsayılan kullanılıyor):", e);
    }
  };

  // 2️⃣ Eski Bölgeleri Çek (Hata Korumalı)
  const fetchFirebaseData = async () => {
    try {
      const q = query(
        collection(db, "risky_locations"),
        where("userId", "==", userId),
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(`✅ ${fetched.length} adet eski bölge yüklendi.`);
      setExistingLocations(fetched);
    } catch (error) {
      console.log("🔥 Firebase verisi çekilemedi:", error);
    }
  };

  const confirmSave = async () => {
    if (!locationName.trim()) {
      Alert.alert("Hata", "Lütfen bölgeye bir isim verin.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "risky_locations"), {
        userId: userId,
        name: locationName.trim(),
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        radius: 100,
        createdAt: Timestamp.now(),
      });

      // Geofencing Başlat
      await Location.startGeofencingAsync("RISKY_ZONE_TASK", [
        {
          identifier: `${locationName}_${Date.now()}`,
          latitude: selectedPoint.latitude,
          longitude: selectedPoint.longitude,
          radius: 100,
          notifyOnEnter: true,
        },
      ]);

      setIsModalVisible(false);
      Alert.alert("Başarılı 🛡️", `${locationName} kaydedildi.`);
      router.back();
    } catch (error) {
      Alert.alert("Hata", "Kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  if (!dataLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS?.primary || "#007AFF"} />
        <Text style={{ marginTop: 10 }}>Harita Hazırlanıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region} // initialRegion yerine region kullanarak akıcılık sağladık
        onRegionChangeComplete={(reg) => setRegion(reg)}
        onPress={(e) => setSelectedPoint(e.nativeEvent.coordinate)}
        showsUserLocation={true}
      >
        {/* Eski Bölgeler (Gri) */}
        {existingLocations.map((loc) => (
          <React.Fragment key={loc.id}>
            <Marker
              // 🛡️ Koordinatların sayı olduğundan emin oluyoruz (Haritada görünmeme sorunu çözümü)
              coordinate={{
                latitude: Number(loc.latitude),
                longitude: Number(loc.longitude),
              }}
              pinColor="gray"
              title={loc.name}
            />
            <Circle
              center={{
                latitude: Number(loc.latitude),
                longitude: Number(loc.longitude),
              }}
              radius={100}
              fillColor="rgba(128, 128, 128, 0.2)"
              strokeColor="gray"
            />
          </React.Fragment>
        ))}

        {/* Yeni Seçilen Nokta (Mavi/Kırmızı) */}
        {selectedPoint && (
          <>
            <Marker coordinate={selectedPoint} />
            <Circle
              center={selectedPoint}
              radius={100}
              fillColor="rgba(0, 122, 255, 0.2)"
              strokeColor="#007AFF"
            />
          </>
        )}
      </MapView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            !selectedPoint && { backgroundColor: "#CCC" },
          ]}
          onPress={() => setIsModalVisible(true)}
          disabled={!selectedPoint}
        >
          <Text style={styles.saveText}>
            {selectedPoint
              ? "Bölgeyi Adlandır ve Kaydet"
              : "Haritadan Nokta Seçin"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bölgeye İsim Ver</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Ev, Kafe, Bornova..."
              value={locationName}
              onChangeText={setLocationName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={{ color: "#666" }}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSave}
                style={styles.confirmBtn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Kaydet
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  footer: { position: "absolute", bottom: 40, left: 20, right: 20 },
  saveButton: {
    backgroundColor: COLORS?.primary || "#007AFF",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
  },
  saveText: { color: "white", fontWeight: "bold", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    width: "100%",
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  cancelBtn: { padding: 15, flex: 1, alignItems: "center" },
  confirmBtn: {
    backgroundColor: COLORS?.primary || "#007AFF",
    padding: 15,
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
  },
});
