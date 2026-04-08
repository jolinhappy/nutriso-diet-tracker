import * as functions from "firebase-functions";
import express from "express";
import webhookRouter from "./src/routes/webhook";
import apiRouter from "./src/routes/api";

// Webhook app — Firebase runtime 會自動保留 req.rawBody 供簽名驗證
const webhookApp = express();
webhookApp.use(express.json());
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

export const webhook = functions.https.onRequest(webhookApp);
export const api = functions.https.onRequest(apiApp);
