/* 
// app/index.tsx
import { Link } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600", textAlign: "center" }}>
        Addiction Tracker
      </Text>

      <Text style={{ textAlign: "center", color: "#666" }}>
        Günlük anketi doldurarak takibine başla.
      </Text>

      <Link href="../survey"  asChild>
        <TouchableOpacity
          style={{
            backgroundColor: "#007AFF",
            paddingVertical: 14,
            borderRadius: 10,
          }}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: "700" }}
          >
            Anketi Doldur
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
*/
//commit deneme yagmur
// app/index.tsx
import { Link } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600", textAlign: "center" }}>
        Addiction Tracker
      </Text>

      <Text style={{ textAlign: "center", color: "#666" }}>
        Günlük anketi doldurarak takibine başla.
      </Text>

      <Link href="/survey" asChild>
  <TouchableOpacity
    style={{
      backgroundColor: "#007AFF",
      paddingVertical: 14,
      borderRadius: 10,
    }}
  >
    <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
      Anketi Doldur
    </Text>
  </TouchableOpacity>
</Link>
    </View>
  );
}
