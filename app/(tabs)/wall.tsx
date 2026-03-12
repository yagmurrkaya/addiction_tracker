import { collection, onSnapshot, orderBy, query } from "firebase/firestore"; // 👈 Canlı veri için ekledik
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import useAnonymousId from "../../hooks/useAnonymousId";
import { db } from "../../services/firebase/firebaseConfig"; // 👈 Firebase bağlantın
import { PostService } from "../../services/postService";

export default function WallScreen() {
  const userId = useAnonymousId();
  const [posts, setPosts] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 📡 CANLI VERİ AKIŞI (onSnapshot)
  useEffect(() => {
    // Mesajların olduğu koleksiyonu hedefliyoruz
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));

    // Firebase'i dinlemeye başla
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(fetchedPosts);
        setRefreshing(false);
      },
      (error) => {
        console.error("Canlı veri okuma hatası:", error);
        setRefreshing(false);
      },
    );

    // 🛑 Sayfadan çıkınca dinleyiciyi kapat (Memory leak önlemek için)
    return () => unsubscribe();
  }, []);

  const handleSend = async () => {
    if (!newPost.trim() || !userId) return;
    setLoading(true);
    try {
      await PostService.createPost(userId, newPost);
      setNewPost("");
      setModalVisible(false);
      Keyboard.dismiss();
      Alert.alert("Başarılı 💙", "Yazınız anonim duvara eklendi.");

      // ✅ loadPosts() çağırmaya gerek kalmadı, onSnapshot otomatik güncelleyecek!
    } catch (error) {
      Alert.alert("Hata", "Paylaşılırken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => {
          // Canlı akış olduğu için aslında gerek yok ama
          // kullanıcı alışkanlığı için manuel tetikleme bırakılabilir.
          setRefreshing(true);
        }}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Text style={styles.username}>
              {item.username || "Anonim Kullanıcı"}
            </Text>
            <Text style={styles.postText}>{item.text}</Text>
            <Text style={styles.date}>
              {item.createdAt?.toDate()
                ? item.createdAt.toDate().toLocaleString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })
                : "Şimdi"}
            </Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ width: "100%" }}
            >
              <View style={styles.modalContent}>
                <Text style={styles.warningTitle}>Önemli Uyarı ⚠️</Text>
                <Text style={styles.warningBody}>
                  Lütfen kişi, şehir, sokak adı gibi özel bilgilerinizi
                  paylaşmamaya özen gösterin.
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Neler hissediyorsun?"
                  multiline
                  maxLength={280}
                  value={newPost}
                  onChangeText={setNewPost}
                  autoFocus={true}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      Keyboard.dismiss();
                    }}
                    style={styles.cancelButton}
                  >
                    <Text style={{ color: "#666" }}>Vazgeç</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSend}
                    disabled={loading}
                    style={styles.sendButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.sendButtonText}>Paylaş</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  postCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    elevation: 2,
  },
  username: {
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 6,
    fontSize: 14,
  },
  postText: { fontSize: 16, color: "#1C1C1E", lineHeight: 22 },
  date: { fontSize: 11, color: "#8E8E93", alignSelf: "flex-end", marginTop: 8 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: COLORS.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  fabText: { color: "#fff", fontSize: 36, fontWeight: "300" },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#FF9500",
    marginBottom: 8,
  },
  warningBody: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#F2F2F7",
    borderRadius: 15,
    padding: 15,
    textAlignVertical: "top",
    fontSize: 16,
    minHeight: 120,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  cancelButton: { padding: 15, flex: 1, alignItems: "center" },
  sendButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 15,
    flex: 2,
    alignItems: "center",
  },
  sendButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
