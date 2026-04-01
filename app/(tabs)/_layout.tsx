import { Tabs } from "expo-router";
import React from "react";
// 1. Ionicons zaten import edilmiş, onu kullanacağız
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF", // Aktif sekme rengi
        tabBarInactiveTintColor: "#8E8E93", // Pasif sekme rengi
        headerTitleAlign: "center",
      }}
    >
      {/* 1. ANKET SEKME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Anket",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 2. PAYLAŞIM DUVARI */}
      <Tabs.Screen
        name="wall"
        options={{
          title: "Paylaşım Duvarı",
          href: null, // 👈 Bu satır ikonu menüden tamamen siler ama kod yerinde kalır!
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 3. AYARLAR SEKME */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ayarlar",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
