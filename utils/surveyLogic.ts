// 🔹 Tüm soruların cevaplanıp cevaplanmadığını kontrol et
export const validateAllAnswered = (
  questions: any[],
  answers: Record<string, any>,
) => {
  return questions.every((q) => {
    const ans = answers[q.id];
    return (
      ans !== undefined &&
      ans !== null &&
      ans !== "" &&
      !(Array.isArray(ans) && ans.length === 0)
    );
  });
};

// 🔹 1 saatlik bekleme süresini hesapla
export const getRemainingCooldown = (lastSurveyDate: Date) => {
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSurveyDate.getTime()) / (1000 * 60);
  return diffMinutes < 60 ? Math.ceil(60 - diffMinutes) : 0;
};
