import { AiParsedMeal } from "../types";
import { DailySummary } from "../firestore/summaryRepository";

const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";

export async function replyWithMealTypeSelection(replyToken: string): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("[line] LINE_CHANNEL_ACCESS_TOKEN is not set");
    return;
  }

  const mealTypes = ["早餐", "午餐", "晚餐", "點心", "宵夜"];
  const response = await fetch(LINE_REPLY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages: [
        {
          type: "text",
          text: "收到照片！請選擇這是哪一餐？",
          quickReply: {
            items: mealTypes.map((label) => ({
              type: "action",
              action: { type: "message", label, text: label },
            })),
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[line] quick reply failed ${response.status}: ${body}`);
  }
}

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
        `- ${item.name} ${item.amount} → 蛋白質 ${Math.round(item.protein)}g / 碳水 ${Math.round(item.carbs)}g / 脂肪 ${Math.round(item.fat)}g (總熱量 ${Math.round(item.calories)} 大卡)`,
    )
    .join("\n");

  return [
    `✅ 已記錄${meal.mealType}`,
    itemLines,
    "",
    "今日剩餘",
    `熱量：${Math.round(summary.remainingCalories)} kcal`,
    `蛋白質：${Math.round(summary.remainingProtein)}g`,
    `碳水：${Math.round(summary.remainingCarbs)}g`,
    `脂肪：${Math.round(summary.remainingFat)}g`,
    "",
    "詳細資訊請點選下方選單「今日紀錄」",
  ].join("\n");
}

export const PARSE_FAILURE_REPLY =
  "抱歉，我無法解析您的飲食內容。\n請試著這樣描述：「午餐吃了雞胸肉150g和白飯一碗」";

export const IMAGE_PARSE_FAILURE_REPLY =
  "抱歉，我無法識別這張照片的食物內容。\n請確認照片清晰，或改用文字描述：「午餐吃了雞胸肉150g和白飯一碗」";

export const NOT_FOOD_IMAGE_REPLY =
  "這張照片看起來不是食物或營養標籤 🙅\n請傳送食物照片或營養標籤，我才能幫你記錄喔！";
