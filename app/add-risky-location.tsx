import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
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
  const [region, setRegion] = useState<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 🛠️ GÜÇLENDİRİLMİŞ KONUM ALMA FONKSİYONU
  const fetchLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Hata", "Haritayı kullanmak için konum izni gerekli.");
        return;
      }

      // 1. Önce en son bilinen konumu almayı dene (Çok hızlıdır, emülatörü yormaz)
      let location = await Location.getLastKnownPositionAsync({});

      // 2. Eğer o yoksa, yeni bir konum sorgula (Accuracy.Balanced emülatör için daha kararlıdır)
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      if (location) {
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    } catch (error) {
      console.log(
        "📍 Konum henüz hazır değil, emülatörden sinyal bekleniyor...",
      );
      // ⚠️ HATA ALIRSAK: 2 saniye sonra tekrar dene (Sonsuz yükleme ekranında kalmaz)
      setTimeout(fetchLocation, 2000);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const handleMapPress = (e: any) => {
    setSelectedPoint(e.nativeEvent.coordinate);
  };

  const saveLocation = async () => {
    if (!selectedPoint || !userId) {
      Alert.alert("Uyarı", "Lütfen harita üzerinde bir nokta seçin.");
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Firebase'e Kaydet
      await addDoc(collection(db, "risky_locations"), {
        userId: userId,
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        radius: 100,
        createdAt: Timestamp.now(),
      });

      // 2️⃣ Geofencing Başlat
      await Location.startGeofencingAsync("RISKY_ZONE_TASK", [
        {
          identifier: `risk_${Date.now()}`,
          latitude: selectedPoint.latitude,
          longitude: selectedPoint.longitude,
          radius: 100,
          notifyOnEnter: true,
          notifyOnExit: false,
        },
      ]);

      Alert.alert(
        "Başarılı 🛡️",
        "Riskli bölge kaydedildi. Yaklaştığında seni uyaracağız.",
      );
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Hata", "Kaydedilirken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS?.primary || "#007AFF"} />
        <Text style={styles.loadingText}>
          Konumunuz emülatörden bekleniyor...
        </Text>
        <Text style={styles.loadingSubText}>
          (Lütfen emülatör panelinden Send butonuna basın)
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        onPress={handleMapPress}
        showsUserLocation={true}
      >
        {selectedPoint && (
          <>
            <Marker coordinate={selectedPoint} />
            <Circle
              center={selectedPoint}
              radius={100}
              fillColor="rgba(255, 0, 0, 0.2)"
              strokeColor="red"
            />
          </>
        )}
      </MapView>

      <View style={styles.footer}>
        <Text style={styles.hint}>Haritada riskli bölgeye dokunun</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            !selectedPoint && { backgroundColor: "#CCC" },
          ]}
          onPress={saveLocation}
          disabled={loading || !selectedPoint}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Bölgeyi Kaydet</Text>
          )}
        </TouchableOpacity>
      </View>
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
  loadingText: { marginTop: 15, fontSize: 16, fontWeight: "600" },
  loadingSubText: { marginTop: 5, fontSize: 12, color: "#888" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    elevation: 5,
  },
  hint: { textAlign: "center", marginBottom: 10, color: "#666" },
  saveButton: {
    backgroundColor: COLORS?.primary || "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
