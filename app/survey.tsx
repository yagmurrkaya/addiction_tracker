import { Text, View } from "react-native";

export default function SurveyScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "black",
      }}
    >
      <Text style={{ color: "white", fontSize: 22 }}>
        🎯 Survey Screen Yüklendi!
      </Text>
    </View>
  );
}