import Slider from "@react-native-community/slider";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/Colors";

const QuestionCard = ({ question, answer, onAnswer }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.questionText}</Text>

      {/* SINGLE CHOICE */}
      {question.type === "single" &&
        question.options?.map((opt: string) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onAnswer(question.id, opt)}
            style={[
              styles.button,
              {
                backgroundColor:
                  answer === opt ? COLORS.primary : COLORS.secondary,
              },
            ]}
          >
            <Text
              style={{ color: answer === opt ? COLORS.white : COLORS.text }}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}

      {/* MULTI CHOICE */}
      {question.type === "multi" &&
        question.options?.map((opt: string) => {
          const selected = answer?.includes(opt);
          const isNoneOption = opt.toLowerCase().includes("hiçbiri");

          return (
            <TouchableOpacity
              key={opt}
              onPress={() => {
                let updated = [...(answer || [])];
                if (isNoneOption) {
                  updated = selected ? [] : [opt];
                } else {
                  updated = updated.filter(
                    (x: string) => x.toLowerCase() !== "hiçbiri",
                  );
                  updated = selected
                    ? updated.filter((x: string) => x !== opt)
                    : [...updated, opt];
                }
                onAnswer(question.id, updated);
              }}
              style={[
                styles.button,
                {
                  backgroundColor: selected ? COLORS.primary : COLORS.secondary,
                },
              ]}
            >
              <Text style={{ color: selected ? COLORS.white : COLORS.text }}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}

      {/* SLIDER */}
      {question.type === "slider" && (
        <View>
          <Slider
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={answer || 0}
            onValueChange={(v) => onAnswer(question.id, v)}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.divider}
            thumbTintColor={COLORS.primary}
            style={{ height: 40 }}
          />
          <Text style={styles.sliderLabel}>Seçilen düzey: {answer || "—"}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    elevation: 2, // Android için gölge
    shadowColor: "#000", // iOS için gölge
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  questionText: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  button: { padding: 12, borderRadius: 8, marginVertical: 4 },
  sliderLabel: { textAlign: "center", marginTop: 5, color: COLORS.gray },
});

export default QuestionCard;
