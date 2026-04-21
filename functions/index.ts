import * as functions from "firebase-functions";
import express from "express";
import webhookRouter from "./src/routes/webhook";
import apiRouter from "./src/routes/api";

const SECRETS = ["LINE_CHANNEL_SECRET", "LINE_CHANNEL_ACCESS_TOKEN", "CLAUDE_API_KEY"];

// Webhook app — 透過 verify callback 保留 rawBody 供簽名驗證（emulator 和正式環境都需要）
const webhookApp = express();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
webhookApp.use(express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf } }));
webhookApp.use((req, _res, next) => {
  console.log("[webhookApp] method:", req.method);
  console.log("[webhookApp] path:", req.path);
  console.log("[webhookApp] url:", req.url);
  next();
});
webhookApp.use(webhookRouter);

// API app
const apiApp = express();
apiApp.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-line-userid, ngrok-skip-browser-warning");
  if (_req.method === "OPTIONS") { res.status(200).end(); return; }
  next();
});
apiApp.use(express.json());
apiApp.use(apiRouter);

export const webhook = functions.runWith({ secrets: SECRETS }).https.onRequest(webhookApp);
export const api = functions.runWith({ secrets: SECRETS }).https.onRequest(apiApp);
