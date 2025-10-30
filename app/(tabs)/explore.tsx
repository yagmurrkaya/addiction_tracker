import React from 'react';
import { StyleSheet, View } from 'react-native';

// Projenizdeki özel ThemedText ve ThemedView bileşenlerini kullanıyoruz.
// Eğer bunlar mevcut değilse, React Native'in standart Text ve View bileşenleriyle değiştirilebilir.
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function TabTwoScreen() {
  return (
    // ThemedView, uygulamanızın koyu/açık modunu desteklemek için bir konteynerdir
    <ThemedView style={styles.container}>
      <View style={styles.headerContainer}>
        <ThemedText style={styles.headerText} type="title">
          Anonim Paylaşım Duvarı
        </ThemedText>
      </View>

      {/* Bu alan, gelecekte Firebase'den çekilecek anonim kullanıcı paylaşımları
        ve yorumlarının gösterileceği yer olacaktır. 
      */}
      <View style={styles.contentArea}>
        <ThemedText style={styles.placeholderText}>
          Sonraki geliştirmelerde bu kısımda anonim paylaşım duvarı (Post Wall) olacak.
        </ThemedText>
        <ThemedText style={styles.subPlaceholderText} type="subtitle">
          (Şu an için anket toplama kısmına odaklanıyoruz.)
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    color: '#007AFF',
    fontWeight: '600',
  },
  subPlaceholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
