import { Request, Response } from "express";
import { parseFoodMessage } from "../ai/parseFood";
import { ensureUserExists, getUser } from "../firestore/userRepository";
import { saveMeal } from "../firestore/mealRepository";
import { getDailySummary } from "../firestore/summaryRepository";
import { replyMessage, buildSuccessReply, PARSE_FAILURE_REPLY } from "./lineReply";

const NO_GOALS_REPLY =
  "您尚未設定每日營養目標！\n請先開啟主頁面，前往「設定」標籤，設定每日熱量與蛋白質、碳水、脂肪目標後，再開始記錄飲食 🥗";

interface LineTextMessage {
  type: "text";
  text: string;
}

interface LineEvent {
  type: string;
  source?: { userId?: string };
  message?: LineTextMessage | { type: string };
  replyToken?: string;
}

interface LineWebhookBody {
  destination: string;
  events: LineEvent[];
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

    if (!event.message || event.message.type !== "text") {
      console.log(`[webhook] skip non-text message: ${event.message?.type}`);
      continue;
    }

    const userId = event.source?.userId ?? "unknown";
    const text = (event.message as LineTextMessage).text;

    console.log(`[webhook] userId: ${userId}`);
    console.log(`[webhook] message: "${text}"`);
    console.log(`[webhook] replyToken: ${event.replyToken}`);

    const replyToken = event.replyToken ?? ''

    await ensureUserExists(userId);
    const user = await getUser(userId);
    if (!user?.goals) {
      console.log(`[webhook] 使用者尚未設定目標：${userId}`);
      await replyMessage(replyToken, NO_GOALS_REPLY);
      continue;
    }

    const parsed = await parseFoodMessage(text);
    if (parsed === null) {
      console.log(`[webhook] AI 無法解析：${text}`);
      await replyMessage(replyToken, PARSE_FAILURE_REPLY);
      continue;
    }

    console.log("[webhook] AI 解析結果:", JSON.stringify(parsed, null, 2));
    const mealId = await saveMeal(userId, text, parsed);
    console.log(`[webhook] 寫入成功 mealId: ${mealId}`);

    // saveMeal 已寫入，重新從 Firestore 撈今日加總（含剛寫入的這筆）
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const summary = await getDailySummary(userId, today);
    const replyText = buildSuccessReply(parsed, summary);
    await replyMessage(replyToken, replyText);
    console.log(`[webhook] 已回覆 LINE userId: ${userId}`);
  }
}
