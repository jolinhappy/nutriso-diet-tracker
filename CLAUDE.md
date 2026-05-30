# 飲食紀錄小工具
LINE Bot + LIFF 飲食紀錄。LINE 訊息輸入 → AI 解析營養素 → LIFF 查看圖表。

## 技術棧
React + TypeScript + Tailwind + LIFF SDK | Express + Firebase Functions + Firestore | Claude Haiku 4.5（營養解析）

## Monorepo（npm workspaces）
- 根目錄工具：npm install -D {pkg} -w root
- 前端套件：npm install {pkg} -w src（⚠️ 不是 frontend）
- 後端套件：npm install {pkg} -w functions

## 核心規則
- 前端**不可**直接存取 Firestore，一律透過 Express API
- Firestore 只有 functions/src/firestore/ 可以存取

## React Query
- Query keys：['user', id] | ['meals', id, date] | ['summary', id, date] | ['history', id, days]
- invalidate 規則：新增/編輯/刪除餐點 → meals + summary；更新目標 → user + summary

## 開發環境
- 啟動：firebase emulators:start
- ngrok：ngrok http 5001
- Webhook 本地：https://{ngrok-id}.ngrok.io/{projectId}/us-central1/webhook
- 色系定義：tailwind.config.js（primary 主色 #17B8D4）
- 參考文件：@docs/architecture.md、@docs/schema.md、@docs/api.md

## ⚠️ 已知坑

**Node 版本**：系統預設 v10 會炸，build/deploy 前必須 `nvm use 20`

**Webhook handler**：不可在 for loop 前送 res.status(200)，Functions 回應後即終止。
正確做法：所有事件處理完畢後，最後才 `res.status(200).json({ status: "ok" })`

**環境變數**：
- Vite envDir 設為 "."，env 檔是 frontend/.env（不是 root）
- functions/.env secrets 正式環境存 Secret Manager，本地才填 .env
- lineUserId 是執行期動態取得（前端 liff.getProfile()，後端 Webhook payload）