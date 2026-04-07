import Anthropic from "@anthropic-ai/sdk";
import { AiParsedMeal, MealType, FoodItem } from "../types";

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const SYSTEM_PROMPT = `你是一個專業的營養師助手。
用戶會描述他們吃了什麼食物和份量，
請解析成營養素資訊並以 JSON 格式回傳。
只回傳 JSON，不要有其他文字。`;

function buildUserPrompt(userMessage: string): string {
  return `用戶說：${userMessage}

請回傳以下格式：
{
  "mealType": "早餐|午餐|晚餐|點心|宵夜",
  "items": [
    {
      "name": "食物名稱",
      "amount": "份量",
      "calories": 數字,
      "protein": 數字,
      "carbs": 數字,
      "fat": 數字
    }
  ],
  "totalCalories": 數字,
  "totalProtein": 數字,
  "totalCarbs": 數字,
  "totalFat": 數字
}`;
}

const VALID_MEAL_TYPES: MealType[] = ["早餐", "午餐", "晚餐", "點心", "宵夜"];

function isValidParsedMeal(data: unknown): data is AiParsedMeal {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;

  if (!VALID_MEAL_TYPES.includes(d.mealType as MealType)) return false;
  if (!Array.isArray(d.items)) return false;
  if (typeof d.totalCalories !== "number") return false;
  if (typeof d.totalProtein !== "number") return false;
  if (typeof d.totalCarbs !== "number") return false;
  if (typeof d.totalFat !== "number") return false;

  for (const item of d.items as unknown[]) {
    if (!item || typeof item !== "object") return false;
    const i = item as Record<string, unknown>;
    if (typeof i.name !== "string") return false;
    if (typeof i.amount !== "string") return false;
    if (typeof i.calories !== "number") return false;
    if (typeof i.protein !== "number") return false;
    if (typeof i.carbs !== "number") return false;
    if (typeof i.fat !== "number") return false;
  }

  return true;
}

export async function parseFoodMessage(
  userMessage: string,
): Promise<AiParsedMeal | null> {
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(userMessage) }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      console.error("[ai] unexpected response type:", content.type);
      return null;
    }

    const cleanJson = content.text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed: unknown = JSON.parse(cleanJson);

    if (!isValidParsedMeal(parsed)) {
      console.error("[ai] invalid response shape:", content.text);
      return null;
    }

    return parsed as AiParsedMeal & { items: FoodItem[] };
  } catch (err) {
    console.error("[ai] parseFoodMessage error:", err);
    return null;
  }
}
