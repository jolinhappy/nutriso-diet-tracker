# 飲食紀錄小工具

## 專案概述
結合 LINE Bot + LIFF 的每日飲食紀錄工具。
使用者透過 LINE 訊息記錄飲食，AI 會自動解析營養素及熱量，LIFF 頁面可以查看已攝取營養素圖表與管理紀錄。

## 技術棧
- 前端：React + TypeScript + Tailwind CSS + LIFF SDK (@line/liff) + Axios + React Query
- 後端：Express + Firebase Functions
- 資料庫：Firestore
- AI：Claude Haiku 4.5 API（食物營養素解析）
- 訊息：LINE Messaging API (Webhook)

## Monorepo 管理
- 使用 npm workspaces 管理 monorepo
- 根目錄 package.json 定義 workspaces：
  - functions/（後端）
  - frontend/（前端）
  - shared/（共用型別）
- 安裝套件時注意：
  - 根目錄共用工具：npm install -D {套件} -w root
  - 前端套件：npm install {套件} -w src
  - 後端套件：npm install {套件} -w functions

## 目錄結構
functions/src/
  webhook/    # LINE Webhook handler
  ai/         # Claude API 呼叫
  firestore/  # Firestore CRUD
  routes/     # Express routes
frontend/src/
  components/ # UI 元件
  pages/      # Tab 頁面
  hooks/      # Custom hooks
  lib/        # Axios instance、LIFF 初始化
  types/      # TypeScript 型別
shared/
  types/      # 前後端共用型別

## 核心規則
- 前端不直接使用 Firebase SDK 存取 Firestore
- 所有資料操作（讀取、寫入）一律透過 Express API
- Firestore 只有 functions/src/firestore/ 可以存取

## React Query 規範
- 所有 API 呼叫一律透過 React Query 管理，不直接在元件裡用 useEffect + fetch
- Query Key 統一定義：
  - 用戶資料：['user', lineUserId]
  - 今日餐點：['meals', lineUserId, date]
  - 今日摘要：['summary', lineUserId, date]
  - 歷史紀錄：['history', lineUserId, days]
- invalidateQueries 連動規則：
  - 新增/編輯/刪除餐點後：invalidate meals + summary
  - 更新營養素目標後：invalidate user + summary

## 開發規範
- 使用 TypeScript（前後端皆是）
- 使用 2 格空格縮排
- 非同步操作一律使用 async/await，不用 .then()
- 環境變數統一用 `.env` 管理，不可 hardcode 任何 API key

## 開發參考文件
- 詳細架構與資料流：@docs/architecture.md
- Firestore schema：@docs/schema.md
- API 規格：@docs/api.md

## 開發環境
- LINE Webhook 本地開發需搭配 ngrok
- 本地啟動指令：firebase emulators:start
- ngrok 啟動指令：ngrok http 5001
- Webhook URL 格式（本地）：https://{ngrok-id}.ngrok.io/你的專案ID/us-central1/webhook
- Webhook URL 格式（正式）：https://us-central1-{projectId}.cloudfunctions.net/webhook

## UI 色系規範
以下色碼下去呈現 UI 介面
```
colors: {
  primary: {
    800: '#083F49',
    700: '#0E6F81',
    600: '#128EA4',
    // Main
    500: '#17B8D4',
    400: '#4DD4EC',
    300: '#A1E8F5',
    200: '#D0F4FA',
    100: '#FAFEFE',
  },
  orange: {
    600: '#DD7200',
    500: '#F77F00',
    400: '#FF972A',
    300: '#FFB96E',
    200: '#FFE5C9',
    100: '#FFF8F1',
  },
  yellow: {
    600: '#DCB900',
    500: '#FFD700',
    400: '#FFE55C',
    300: '#FFED8D',
    200: '#FFF8CF',
    100: '#FFFCED',
  },
  error: {
    600: '#961316',
    500: '#961316',
    400: '#E32227',
    300: '#ED7377',
    200: '#F9D2D3',
    100: '#FFF5F5',
  },
  text: '#000000',
  white: '#FFFFFF',
  gray: {
    700: '#2C2C2C',
    600: '#575757',
    500: '#787878',
    400: '#A1A1A1',
    300: '#C5C5C5',
    200: '#DEDEDE',
    100: '#EEEEEE',
  },
  blue: {
    500: '#0F4C8A',
    400: '#146AC3',
    300: '#338DEA',
    200: '#7FB8F2',
    100: '#CFE4FA',
  },
  black: {
    '80%': 'rgba(0, 0, 0, 0.8)',
    '65%': 'rgba(0, 0, 0, 0.65)',
    '50%': 'rgba(0, 0, 0, 0.5)',
    '35%': 'rgba(0, 0, 0, 0.35)',
  },
},
```

## 環境變數
- 環境變數範本：根目錄 .env.example（前端）、functions/.env.example（後端）
- 實際值填入對應的 .env，不可 commit
- lineUserId 是執行期間動態取得，不是環境變數
  - 前端：liff.getProfile() 取得
  - 後端：LINE Webhook payload 或 request header 取得

## 注意事項
- LIFF SDK 使用 @line/liff，不是其他第三方套件
- Firebase Functions 使用 firebase-functions v4+
- React Query 套件名稱是 @tanstack/react-query
- service-account 不 commit 進 git