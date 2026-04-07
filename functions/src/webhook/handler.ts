import { Request, Response } from "express";
import { parseFoodMessage } from "../ai/parseFood";

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

    const parsed = await parseFoodMessage(text);
    if (parsed === null) {
      console.log(`[webhook] AI 無法解析：${text}`);
    } else {
      console.log("[webhook] AI 解析結果:", JSON.stringify(parsed, null, 2));
    }
  }
}
