import * as functions from "firebase-functions";
import express from "express";
import webhookRouter from "./src/routes/webhook";

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

// API app — 後續實作 REST API
const apiApp = express();
apiApp.use(express.json());
// TODO: apiApp.use('/', apiRouter)

export const webhook = functions.https.onRequest(webhookApp);
export const api = functions.https.onRequest(apiApp);
