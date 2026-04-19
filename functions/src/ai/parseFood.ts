import Anthropic from "@anthropic-ai/sdk";
import { AiParsedMeal, MealType, FoodItem } from "../types";

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const SYSTEM_PROMPT = `你是一個專業的營養師助手。
用戶會描述他們吃了什麼食物和份量，
請解析成營養素資訊並以 JSON 格式回傳。
份量（amount）必須以 g 或 ml 為單位（例如 "200g"、"250ml"），若用戶使用碗、片、顆等單位，請換算成最接近的公克數。
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

const IMAGE_SYSTEM_PROMPT = `你是一個專業的營養師助手。
用戶會提供食物照片或營養標籤照片，
請識別圖片中的食物和份量，解析成營養素資訊並以 JSON 格式回傳。
如果是營養標籤，請直接讀取標籤上的數值。
份量（amount）必須以 g 或 ml 為單位（例如 "200g"、"250ml"），若估算時使用碗、片、顆等單位，請換算成最接近的公克數。
只回傳 JSON，不要有其他文字。`;

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export interface ImageInput {
  base64: string
  mediaType: ImageMediaType
}

function buildImageUserPrompt(mealType: MealType, imageCount: number): string {
  const prefix = imageCount > 1
    ? `這是使用者「${mealType}」的 ${imageCount} 張照片，請識別所有圖片中的食物和份量（同一食物不要重複計算），合併解析成一份營養素紀錄。`
    : `這是使用者的「${mealType}」照片，請識別圖片中的所有食物和份量，解析營養素。`

  return `${prefix}

請回傳以下格式：
{
  "mealType": "${mealType}",
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

/** 快速判斷圖片是否包含食物或營養標籤，回傳 true 表示是食物 */
export async function isFoodImage(images: ImageInput[]): Promise<boolean> {
  try {
    const imageBlocks = images.map((img) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: img.mediaType,
        data: img.base64,
      },
    }))

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: '這張圖片是否包含食物、餐點或營養標籤？只回答 yes 或 no。',
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.toLowerCase().trim() : ''
    return text.startsWith('yes')
  } catch (err) {
    console.error("[ai] isFoodImage error:", err)
    // 驗證失敗時保守地放行，讓後續 parse 決定
    return true
  }
}

export async function parseFoodImage(
  images: ImageInput[],
  mealType: MealType,
): Promise<AiParsedMeal | null> {
  try {
    const imageBlocks = images.map((img) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: img.mediaType,
        data: img.base64,
      },
    }))

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: IMAGE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: buildImageUserPrompt(mealType, images.length),
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      console.error("[ai] unexpected image response type:", content.type);
      return null;
    }

    const cleanJson = content.text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed: unknown = JSON.parse(cleanJson);

    if (!isValidParsedMeal(parsed)) {
      console.error("[ai] invalid image response shape:", content.text);
      return null;
    }

    return parsed as AiParsedMeal & { items: FoodItem[] };
  } catch (err) {
    console.error("[ai] parseFoodImage error:", err);
    return null;
  }
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
