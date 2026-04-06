# Firestore Schema

## 資料庫規則
- Firestore 只有後端（functions/src/firestore/）可以存取
- 前端不直接讀寫 Firestore，一律透過 Express API

## users/{lineUserId}
```typescript
{
  lineUserId: string        // LINE userId，同時是文件 ID
  displayName: string       // 從 LINE Profile 取得
  email: string | null      // 預留欄位，MVP 階段為 null
  goals: {
    calories: number        // 每日目標熱量 (kcal)
    protein: number         // 蛋白質目標 (g)
    carbs: number           // 碳水化合物目標 (g)
    fat: number             // 脂肪目標 (g)
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 預設目標值（用戶尚未設定時）
```typescript
{
  calories: 2000,
  protein: 60,
  carbs: 250,
  fat: 65
}
```

---

## records/{lineUserId}/daily/{date}/meals/{mealId}

date 格式：YYYY-MM-DD（例：2026-04-06）
mealId：Firestore auto-generated ID
```typescript
{
  id: string
  mealType: '早餐' | '午餐' | '晚餐' | '點心' | '宵夜'
  description: string       // 用戶原始輸入文字
  items: [
    {
      name: string          // 食物名稱
      amount: string        // 份量（例："150g"、"1碗"）
      calories: number      // kcal
      protein: number       // g
      carbs: number         // g
      fat: number           // g
    }
  ]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

## 查詢說明

### 取得今日所有餐點
```
collection: records/{lineUserId}/daily/{date}/meals
orderBy: createdAt asc
```

### 取得最近 7 天紀錄
```
collection: records/{lineUserId}/daily
where: date >= 7天前
orderBy: date desc
```

### 計算今日剩餘營養素（後端邏輯）
```
今日剩餘 = 用戶目標 - 今日所有 meals 的 total 加總
```

## 計算邏輯說明
- 剩餘營養素、剩餘熱量不存在 Firestore，由後端即時計算後放入 API response
- 計算公式：剩餘 = users/{lineUserId}.goals 對應營養素/熱量 - 當日所有 meals 的對應營養素/熱量 total 加總
- 前端只負責顯示，不做任何營養素計算