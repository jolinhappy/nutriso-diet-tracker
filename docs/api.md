# API 定義

## Base URL
- 本地開發：https://{ngrok-id}.ngrok.io
- 正式環境：https://us-central1-{projectId}.cloudfunctions.net

## 共用規則
- 所有請求 Header 需帶 `x-line-userid: {lineUserId}`（前端從 LIFF SDK 取得）
- 所有回應格式：`{ success: boolean, data?: any, error?: string }`
- 時間格式：ISO 8601（例：2026-04-04T12:00:00Z）
- 日期格式：YYYY-MM-DD（例：2026-04-04）

---

## LINE Webhook

### POST /webhook
LINE Platform 呼叫，不是前端呼叫。

Request（由 LINE 發送）：
{
  "events": [{
    "type": "message",
    "source": { "userId": "U123456" },
    "message": { "type": "text", "text": "午餐吃了雞胸肉150g" },
    "replyToken": "abc123"
  }]
}

處理流程：
1. 驗證 LINE 簽名（x-line-signature header）
2. 呼叫 Claude Haiku 解析食物營養素
3. 寫入 Firestore
4. 用 replyToken 回傳純文字給用戶

---

## 用戶 API
### GET /api/users/:lineUserId
取得用戶資料與營養素目標

Response：
{
  "success": true,
  "data": {
    "lineUserId": "U123456",
    "displayName": "王小明",
    "email": null,
    "dailyGoals": {
      "calories": 2000,
      "protein": 150,
      "carbs": 200,
      "fat": 60
    }
  }
}

---

### POST /api/users/:lineUserId/goals
更新營養素目標（設定頁面使用）

Request：
{
  "calories": 2000,
  "protein": 150,
  "carbs": 200,
  "fat": 60
}

Response：
{
  "success": true,
  "data": { "updatedAt": "2026-04-04T12:00:00Z" }
}

---

## 餐點紀錄 API

### GET /api/records/:lineUserId/daily/:date
取得指定日期的所有餐點與當日營養素加總

Response：
{
  "success": true,
  "data": {
    "date": "2026-04-04",
    "meals": [
      {
        "id": "meal_001",
        "mealType": "午餐",
        "description": "午餐吃了雞胸肉150g和白飯一碗",
        "items": [
          {
            "name": "雞胸肉",
            "amount": "150g",
            "calories": 165,
            "protein": 35,
            "carbs": 0,
            "fat": 3
          },
          {
            "name": "白飯",
            "amount": "200g",
            "calories": 260,
            "protein": 4,
            "carbs": 74,
            "fat": 1
          }
        ],
        "totalCalories": 425,
        "totalProtein": 39,
        "totalCarbs": 74,
        "totalFat": 4,
        "createdAt": "2026-04-04T12:00:00Z"
      }
    ],
    "summary": {
      "totalCalories": 425,
      "totalProtein": 39,
      "totalCarbs": 74,
      "totalFat": 4,
      "remainingCalories": 1575,
      "remainingProtein": 111,
      "remainingCarbs": 126,
      "remainingFat": 56
    }
  }
}

---
### PUT /api/records/:lineUserId/meals/:mealId
編輯指定餐點（LIFF 編輯功能使用）

Request：
{
  "mealType": "午餐",
  "items": [
    {
      "name": "雞胸肉",
      "amount": "200g",
      "calories": 220,
      "protein": 46,
      "carbs": 0,
      "fat": 4
    }
  ],
  "totalCalories": 220,
  "totalProtein": 46,
  "totalCarbs": 0,
  "totalFat": 4
}

Response：
{
  "success": true,
  "data": { "updatedAt": "2026-04-04T12:00:00Z" }
}

---

### DELETE /api/records/:lineUserId/meals/:mealId
刪除指定餐點

Response：
{
  "success": true,
  "data": { "deletedAt": "2026-04-04T12:00:00Z" }
}

---

## 歷史紀錄 API

### GET /api/records/:lineUserId/history?days=7
取得最近 N 天的每日摘要（歷史頁面使用）

Response：
{
  "success": true,
  "data": [
    {
      "date": "2026-04-04",
      "totalCalories": 1800,
      "totalProtein": 130,
      "totalCarbs": 180,
      "totalFat": 55,
      "goalCalories": 2000
    },
    {
      "date": "2026-04-03",
      "totalCalories": 2100,
      "totalProtein": 160,
      "totalCarbs": 210,
      "totalFat": 65,
      "goalCalories": 2000
    }
  ]
}