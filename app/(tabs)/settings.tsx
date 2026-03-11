import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors"; // Renk sabitlerin
import useAnonymousId from "../../hooks/useAnonymousId"; // Anonim ID hook'un

export default function SettingsScreen() {
  const router = useRouter();
  const userId = useAnonymousId();
  const [locationEnabled, setLocationEnabled] = useState(false);

  // Sayfa açıldığında izin durumunu kontrol et
  useEffect(() => {
    (async () => {
      const { status } = await Location.getBackgroundPermissionsAsync();
      if (status === "granted") {
        setLocationEnabled(true);
      }
    })();
  }, []);

  const handleLocationToggle = async (value: boolean) => {
    if (value) {
      // 1. Önce ön plan izni (Uygulama açıkken)
      const { status: fgStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== "granted") {
        Alert.alert(
          "İzin Gerekli",
          "Konum servislerini kullanabilmek için izin vermelisiniz.",
        );
        return;
      }

      // 2. Sonra arka plan izni (Uygulama kapalıyken)
      const { status: bgStatus } =
        await Location.requestBackgroundPermissionsAsync();
      if (bgStatus === "granted") {
        setLocationEnabled(true);
      } else {
        Alert.alert(
          "Önemli Hatırlatma ℹ️",
          "Tam koruma için ayarlardan konum iznini 'Her Zaman' olarak seçmelisiniz.",
        );
        setLocationEnabled(false);
      }
    } else {
      setLocationEnabled(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Ayarlar</Text>
      </View> */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Güvenlik ve Farkındalık</Text>

        {/* 1. Konum Servisi Aç/Kapat */}
        <View style={styles.settingItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Konum Servislerini Aç</Text>
            <Text style={styles.settingSubLabel}>
              Riskli bölgelere yaklaşınca seni korur.
            </Text>
          </View>
          <Switch
            value={locationEnabled}
            onValueChange={handleLocationToggle}
            trackColor={{ false: "#D1D1D6", true: "#34C759" }}
          />
        </View>

        {/* 2. Kayıtlı Bölgeleri Yönetme Butonu */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push("/my-locations" as any)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>📍 Kayıtlı Bölgelerim</Text>
            <Text style={styles.settingSubLabel}>
              İşaretlediğin yerleri gör ve yönet.
            </Text>
          </View>
          <Text style={styles.arrowIcon}>›</Text>
        </TouchableOpacity>

        {/* 3. Yeni Bölge Ekleme (Sadece servis açıkken görünür) */}
        {locationEnabled && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ⚠️ Arka planda çalışması için telefon ayarlarınızdan da konum
              servislerini her zaman olarak çevirmeniz gerekmektedir.
            </Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/add-risky-location")}
            >
              <Text style={styles.actionButtonText}>
                ➕ Yeni Riskli Bölge Ekle
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uygulama Bilgileri</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Anonim Kimliğiniz</Text>
          <Text style={styles.userIdText}>User#{userId?.substring(0, 8)}</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Versiyon</Text>
          <Text style={styles.versionText}>1.0.0 (Beta)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#fff" },
  headerTitle: { fontSize: 32, fontWeight: "bold", color: "#000" },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 13,
    color: "#8E8E93",
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLabel: { fontSize: 17, color: "#000", fontWeight: "500" },
  settingSubLabel: { fontSize: 13, color: "#8E8E93", marginTop: 2 },
  arrowIcon: { fontSize: 24, color: "#C7C7CC", marginLeft: 8 },
  userIdText: {
    fontSize: 15,
    color: COLORS?.primary || "#007AFF",
    fontWeight: "600",
  },
  versionText: { fontSize: 15, color: "#8E8E93" },
  infoBox: {
    backgroundColor: "#FFF9E6",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  infoText: {
    fontSize: 13,
    color: "#7A5E00",
    lineHeight: 18,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: COLORS?.primary || "#007AFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  actionButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
