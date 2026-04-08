# 系統架構

## 專案結構
```
diet-tracker/
  functions/              # 後端（Firebase Functions + Express）
    src/
      webhook/            # LINE Webhook handler、簽名驗證
      ai/                 # Claude Haiku API 呼叫、prompt 管理
      firestore/          # Firestore CRUD 操作
      routes/             # Express routes 定義
      types/              # 後端 TypeScript 型別
    index.ts              # Functions 進入點、Express app 初始化
    package.json          # 後端套件管理
    tsconfig.json         # 後端 TypeScript 設定
    .env                  # 後端環境變數（不 commit）
  frontend/               # 前端（React + LIFF）
    src/
      components/         # 共用 UI 元件
      pages/              # Tab 頁面（Today、History、Settings）
      hooks/              # Custom hooks（React Query 封裝）
      lib/                # Axios instance、LIFF 初始化
      types/              # 前端 TypeScript 型別
    package.json          # 前端套件管理
    tsconfig.json         # 前端 TypeScript 設定
    vite.config.ts        # Vite 設定
    tailwind.config.js    # Tailwind 設定
    .env                  # 前端環境變數（不 commit）
  shared/
    types/                # 前後端共用型別（營養素資料結構）
    package.json          # shared 套件管理
  docs/                   # 架構文件
  CLAUDE.md
  firebase.json           # Firebase Hosting + Functions 設定
  package.json            # 根目錄，定義 npm workspaces
  .env.example            # 環境變數範本（需 commit）
  .gitignore
```

## 核心資料流

### LINE Bot 記錄飲食
```
用戶 LINE 訊息（例：午餐吃了雞胸肉150g和白飯一碗）
  → LINE Platform
  → POST /webhook（Firebase Functions）
  → 驗證 LINE 簽名（x-line-signature）
  → 解析 event type（只處理 message type）
  → [後端] POST 到 Claude Haiku API（帶用戶原始訊息）
  → [後端] Claude 回傳營養素 JSON
  → [後端內部] Firebase Admin SDK 寫入 Firestore
   records/{lineUserId}/daily/{date}/meals
  → [後端] POST 到 LINE Reply API（純文字回覆）
  → 用戶看到回覆
```

### LIFF 查看今日紀錄
```
用戶開啟 LIFF
  → liff.init()
  → liff.getProfile() 取得 lineUserId
  → Axios interceptor 設定 x-line-userid header
  → GET /api/records/:lineUserId/daily/:date
  → 顯示餐點列表、熱量與營養素進度條
```

### LIFF 編輯/刪除餐點
```
用戶編輯或刪除餐點
  → PUT /api/records/:lineUserId/meals/:mealId
  → 或 DELETE /api/records/:lineUserId/meals/:mealId
  → React Query invalidateQueries 觸發重新 fetch 今日紀錄
  → invalidateQueries(['meals', lineUserId, date])
  → invalidateQueries(['summary', lineUserId, date])
  → React Query 自動重新打這兩個 API
  → 畫面自動更新顯示最新剩餘營養素
```

### LIFF 設定營養素目標
```
用戶在設定頁面輸入目標
  → POST /api/users/:lineUserId/goals
  → React Query invalidateQueries 觸發重新 fetch 用戶資料
  → 今日頁面剩餘營養素同步更新
```

## LINE Bot 回覆格式（純文字）
```
✅ 已記錄午餐
- 雞胸肉 150g → 蛋白質 35g / 碳水 0g / 脂肪 3g (熱量 XXX 大卡)
- 白飯 200g → 蛋白質 4g / 碳水 74g / 脂肪 1g (熱量 XXX 大卡)

今日剩餘
熱量：1575 kcal
蛋白質：111g
碳水：126g
脂肪：56g

詳細資訊請點選下方選單「今日紀錄」
```

## LIFF 頁面結構（單頁 SPA）
```
App
  └── Layout（底部 Tab 導覽）
        ├── Today Tab（今日）
        │     ├── 熱量進度條
        │     ├── 三大營養素進度條
        │     └── 餐點列表（可編輯/刪除）
        ├── History Tab（歷史）
        │     ├── 最近 7 天熱量長條圖
        │     └── 每日摘要列表（可點選查看明細）
        └── Settings Tab（設定）
              ├── 當前設定好的三大營養素圓餅圖及每日需攝取總熱量(文字標示)
              └── 顯示可以設定的編輯按鈕，可以切換編輯目標熱量與三大營養素輸入表單畫面及當前設定的結果
```

## Claude Haiku Prompt 設計

### System Prompt
```
你是一個專業的營養師助手。
用戶會描述他們吃了什麼食物和份量，
請解析成營養素資訊並以 JSON 格式回傳。
只回傳 JSON，不要有其他文字。
```

### User Prompt
```
用戶說：{用戶原始訊息}

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
}
```

### 解析失敗處理
Claude 無法解析時（例如用戶輸入與食物無關），
回傳純文字給用戶：
```
抱歉，我無法解析您的飲食內容。
請試著這樣描述：「午餐吃了雞胸肉150g和白飯一碗」
```

## 安全性說明
- LINE Webhook 簽名驗證：每個 Webhook 請求都需驗證 x-line-signature
- 用戶身份：MVP 階段前端帶 x-line-userid header，後端直接信任
- 已知風險：x-line-userid header 可被偽造
- 未來改善：改用 LIFF ID Token 向 LINE 驗證身份

## 開發環境設定
- LINE Webhook 本地開發需搭配 ngrok
- 本地啟動：firebase emulators:start
- ngrok 啟動：ngrok http 5001
- Webhook URL（本地）：https://{ngrok-id}.ngrok.io/{projectId}/us-central1/webhook
- Webhook URL（正式）：https://us-central1-{projectId}.cloudfunctions.net/webhook