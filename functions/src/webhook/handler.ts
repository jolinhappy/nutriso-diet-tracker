import { Request, Response } from "express";
import { parseFoodMessage, parseFoodImage, isFoodImage } from "../ai/parseFood";
import { ensureUserExists, getUser } from "../firestore/userRepository";
import { saveMeal } from "../firestore/mealRepository";
import { getDailySummary } from "../firestore/summaryRepository";
import {
  appendPendingImage,
  getPendingImages,
  clearPendingImages,
} from "../firestore/pendingImageRepository";
import {
  replyMessage,
  replyWithMealTypeSelection,
  buildSuccessReply,
  PARSE_FAILURE_REPLY,
  IMAGE_PARSE_FAILURE_REPLY,
  NOT_FOOD_IMAGE_REPLY,
} from "./lineReply";
import { MealType } from "../types";

const NO_GOALS_REPLY =
  "您尚未設定每日營養目標！\n請先開啟主頁面，前往「設定」標籤，設定每日熱量與蛋白質、碳水、脂肪目標後，再開始記錄飲食 🥗";

const VALID_MEAL_TYPES: MealType[] = ["早餐", "午餐", "晚餐", "點心", "宵夜"];

interface LineTextMessage {
  type: "text";
  text: string;
}

interface LineImageMessage {
  type: "image";
  id: string;
}

interface LineEvent {
  type: string;
  source?: { userId?: string };
  message?: LineTextMessage | LineImageMessage | { type: string };
  replyToken?: string;
}

interface LineWebhookBody {
  destination: string;
  events: LineEvent[];
}

async function downloadLineImage(
  messageId: string,
): Promise<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" }> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const res = await fetch(
    `https://api-data.line.me/v2/bot/message/${messageId}/content`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`LINE image download failed: ${res.status}`);

  const rawType = res.headers.get("content-type") ?? "image/jpeg";
  const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
  const mediaType = supportedTypes.find((t) => rawType.includes(t)) ?? "image/jpeg";

  const buffer = Buffer.from(await res.arrayBuffer());
  return { base64: buffer.toString("base64"), mediaType };
}

export async function handleWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as LineWebhookBody;

  // LINE 要求盡快回應 200，避免 timeout retry
  res.status(200).json({ status: "ok" });

  for (const event of body.events) {
    if (event.type !== "message") {
      console.log(`[webhook] skip event type: ${event.type}`);
      continue;
    }

    const msgType = event.message?.type;
    if (msgType !== "text" && msgType !== "image") {
      console.log(`[webhook] skip message type: ${msgType}`);
      continue;
    }

    const userId = event.source?.userId ?? "unknown";
    const replyToken = event.replyToken ?? "";

    console.log(`[webhook] userId: ${userId}, msgType: ${msgType}`);

    await ensureUserExists(userId);
    const user = await getUser(userId);
    if (!user?.goals) {
      console.log(`[webhook] 使用者尚未設定目標：${userId}`);
      await replyMessage(replyToken, NO_GOALS_REPLY);
      continue;
    }

    // ── 圖片訊息：先驗證是食物，再 append 到待處理清單 ──────────
    if (msgType === "image") {
      const imageId = (event.message as LineImageMessage).id;
      console.log(`[webhook] 收到圖片 messageId: ${imageId}`);

      const image = await downloadLineImage(imageId);
      const isFood = await isFoodImage([image]);
      if (!isFood) {
        console.log(`[webhook] 非食物圖片，拒絕處理 messageId: ${imageId}`);
        await replyMessage(replyToken, NOT_FOOD_IMAGE_REPLY);
        continue;
      }

      await appendPendingImage(userId, imageId);
      await replyWithMealTypeSelection(replyToken);
      continue;
    }

    // ── 文字訊息 ────────────────────────────────────────────────
    const text = (event.message as LineTextMessage).text;
    console.log(`[webhook] 收到文字：${text}`);

    // 若文字是餐別選項，且有待處理的圖片 → 下載全部並一次分析
    if (VALID_MEAL_TYPES.includes(text as MealType)) {
      const pending = await getPendingImages(userId);
      if (pending) {
        console.log(`[webhook] 處理 ${pending.messageIds.length} 張待分析圖片，餐別：${text}`);
        await clearPendingImages(userId);

        const images = await Promise.all(pending.messageIds.map(downloadLineImage));
        const parsed = await parseFoodImage(images, text as MealType);
        if (parsed === null) {
          console.log(`[webhook] AI 無法識別圖片`);
          await replyMessage(replyToken, IMAGE_PARSE_FAILURE_REPLY);
          continue;
        }

        console.log("[webhook] 圖片 AI 解析結果:", JSON.stringify(parsed, null, 2));
        const count = pending.messageIds.length
        const mealId = await saveMeal(userId, `[圖片 ${count} 張] ${text}`, parsed);
        console.log(`[webhook] 寫入成功 mealId: ${mealId}`);

        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Taipei",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());
        const summary = await getDailySummary(userId, today);
        await replyMessage(replyToken, buildSuccessReply(parsed, summary));
        console.log(`[webhook] 已回覆圖片紀錄 userId: ${userId}`);
        continue;
      }
    }

    // 一般文字食物描述
    const parsed = await parseFoodMessage(text);
    if (parsed === null) {
      console.log(`[webhook] AI 無法解析文字：${text}`);
      await replyMessage(replyToken, PARSE_FAILURE_REPLY);
      continue;
    }

    console.log("[webhook] 文字 AI 解析結果:", JSON.stringify(parsed, null, 2));
    const mealId = await saveMeal(userId, text, parsed);
    console.log(`[webhook] 寫入成功 mealId: ${mealId}`);

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const summary = await getDailySummary(userId, today);
    await replyMessage(replyToken, buildSuccessReply(parsed, summary));
    console.log(`[webhook] 已回覆文字紀錄 userId: ${userId}`);
  }
}
