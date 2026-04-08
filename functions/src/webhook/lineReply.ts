import { AiParsedMeal } from "../types";
import { DailySummary } from "../firestore/summaryRepository";

const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";

export async function replyMessage(
  replyToken: string,
  text: string,
): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("[line] LINE_CHANNEL_ACCESS_TOKEN is not set");
    return;
  }

  const response = await fetch(LINE_REPLY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[line] reply failed ${response.status}: ${body}`);
  }
}

// ✅ 已記錄午餐
// - 雞胸肉 150g → 蛋白質 35g / 碳水 0g / 脂肪 3g (總熱量 XXX 大卡)
// ...
// 今日剩餘
// 熱量：1575 kcal
// ...
// 詳細資訊請點選下方選單「今日紀錄」
export function buildSuccessReply(
  meal: AiParsedMeal,
  summary: DailySummary,
): string {
  const itemLines = meal.items
    .map(
      (item) =>
        `- ${item.name} ${item.amount} → 蛋白質 ${item.protein}g / 碳水 ${item.carbs}g / 脂肪 ${item.fat}g (總熱量 ${item.calories} 大卡)`,
    )
    .join("\n");

  return [
    `✅ 已記錄${meal.mealType}`,
    itemLines,
    "",
    "今日剩餘",
    `熱量：${summary.remainingCalories} kcal`,
    `蛋白質：${summary.remainingProtein}g`,
    `碳水：${summary.remainingCarbs}g`,
    `脂肪：${summary.remainingFat}g`,
    "",
    "詳細資訊請點選下方選單「今日紀錄」",
  ].join("\n");
}

export const PARSE_FAILURE_REPLY =
  "抱歉，我無法解析您的飲食內容。\n請試著這樣描述：「午餐吃了雞胸肉150g和白飯一碗」";
