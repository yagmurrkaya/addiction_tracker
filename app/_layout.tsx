import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          title: "Anasayfa",
          headerShown: false,
        }}
      />

      {/* 🔹 Sadece “survey” başlığını kaldırıyoruz */}
      <Stack.Screen
        name="survey"
        options={{
          title: "", // ✅ Ortadaki “survey” yazısını kaldırır
          headerBackVisible: true, // ✅ Geri (Anasayfa) butonu kalır
        }}
      />
    </Stack>
  );
}
