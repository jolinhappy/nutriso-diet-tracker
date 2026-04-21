# Nutriso 飲食紀錄小工具

結合 LINE Bot + LIFF 的每日飲食紀錄工具。透過 LINE 傳送文字或照片描述飲食，AI 自動解析營養素，LIFF 頁面可查看圖表與管理紀錄。

<img width="466" height="1000" alt="712823_0" src="https://github.com/user-attachments/assets/c4f63721-fdd7-4590-bcac-85a9a2a1f0fd" />

<img width="466" height="1000" alt="712822_0" src="https://github.com/user-attachments/assets/ab2c92f3-ecae-4468-b6b7-8cd673e8aa22" />


## 功能

- 傳送文字給 LINE Bot → AI 自動解析食物名稱、份量、熱量、蛋白質、碳水、脂肪
- 傳送食物照片或營養標籤照片 → AI 視覺識別解析
- 多張照片一次上傳，合併為同一餐紀錄
- LIFF 頁面：查看今日/歷史飲食紀錄、進度條、設定每日目標
- 同餐別多筆訊息自動合併為一筆紀錄
- 支援單個食物項目刪除、份量編輯（自動比例換算）、餐別調整

## 技術架構

```
LINE Bot (Messaging API)
  └── Webhook → Firebase Functions (Express)
                  ├── AI 解析 (Claude Haiku)
                  └── Firestore

LIFF (LINE Frontend Framework)
  └── React App → Firebase Hosting
                  └── /api/** → Firebase Functions (Express)
                               └── Firestore
```

**前端**：React + TypeScript + Tailwind CSS + React Query + LIFF SDK

**後端**：Express + Firebase Functions (Node.js 20)

**資料庫**：Firestore

**AI**：Claude Haiku 4.5（文字解析 + 圖片視覺識別）

**訊息**：LINE Messaging API

## 目錄結構

```
diet-tracker/
├── functions/          # 後端 (Firebase Functions)
│   └── src/
│       ├── ai/         # Claude API 呼叫（文字/圖片解析）
│       ├── firestore/  # Firestore CRUD
│       ├── routes/     # Express routes (api, webhook)
│       └── webhook/    # LINE Webhook handler
├── frontend/           # 前端 (React + Vite)
│   └── src/
│       ├── components/ # UI 元件
│       ├── hooks/      # React Query hooks
│       ├── lib/        # axios、LIFF 初始化
│       └── pages/      # 頁面（飲食日記、設定）
├── shared/             # 前後端共用型別
└── firebase.json       # Firebase 設定（Hosting rewrite）
```

## 本地開發環境設定

### 前置需求

- Node.js 20（建議用 nvm：`nvm use 20`）
- Firebase CLI：`npm install -g firebase-tools`
- ngrok（LINE Webhook 本地測試用）

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變數

複製範本並填入實際值：

```bash
# 後端
cp functions/.env.example functions/.env

# 前端（root 目錄，供 Vite 讀取）
cp frontend/.env.example .env
```

`functions/.env` 需要填入：
- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `CLAUDE_API_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS`（Service Account 路徑，本地用）

`.env`（root）需要填入：
- `VITE_LIFF_ID`
- Firebase 相關設定（`VITE_FIREBASE_*`）

> 建議本地開發使用獨立的測試用 LINE Bot，避免影響正式環境。

### 3. 啟動本地環境

```bash
# 啟動 Firebase emulator（後端 + Firestore）
firebase emulators:start

# 另開終端，啟動前端
cd frontend && npm run dev

# 另開終端，啟動 ngrok（LINE Webhook 用）
ngrok http 5001
```

LINE Developers Console Webhook URL 設為：
```
https://{ngrok-id}.ngrok.io/{projectId}/us-central1/webhook
```

### 4. 前端 LIFF 開發說明

本地開發（`IS_DEV = true`）時自動使用 mock userId，不需要真實 LINE 登入。

## 部署

### 後端環境變數（Secret Manager）

```bash
firebase functions:secrets:set LINE_CHANNEL_SECRET
firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
firebase functions:secrets:set CLAUDE_API_KEY
```

### Build + Deploy

```bash
# Build 後端
cd functions && nvm use 20 && npm run build && cd ..

# Build 前端
cd frontend && nvm use 20 && npm run build && cd ..

# 一次部署全部
firebase deploy

# 或分開部署
firebase deploy --only functions
firebase deploy --only hosting
```

部署後需在 LINE Developers Console 更新：
- Webhook URL → `https://us-central1-{projectId}.cloudfunctions.net/webhook`
- LIFF Endpoint URL → `https://{projectId}.web.app`

## Firestore 資料結構

```
records/{lineUserId}/daily/{date}/meals/{mealId}
  - mealType: '早餐' | '午餐' | '晚餐' | '點心' | '宵夜'
  - items: FoodItem[]
  - totalCalories, totalProtein, totalCarbs, totalFat
  - createdAt, updatedAt

users/{lineUserId}
  - goals: { calories, protein, carbs, fat } | null

pending_images/{lineUserId}
  - messageIds: string[]   # 等待選餐別的圖片暫存
  - createdAt              # 10 分鐘後過期
```

## 注意事項

- Firestore 只能在 `functions/src/firestore/` 存取，前端一律透過 Express API
- `service-account.json` 不可 commit
- `functions/.env` 有實際 key 值時不可 commit（正式環境 key 存在 Secret Manager）
