// 共用型別定義（前後端共用）

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MealType = '早餐' | '午餐' | '晚餐' | '點心' | '宵夜';

export interface Meal {
  id: string;
  mealType: MealType;
  description: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  lineUserId: string;
  displayName: string;
  email: string | null;
  dailyGoals: NutritionGoals | null;
}

export interface DailySummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
}

export interface DailyRecord {
  date: string;
  meals: Meal[];
  summary: DailySummary;
}

export interface HistoryItem {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  goalCalories: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Claude AI 解析結果
export interface AiParsedMeal {
  mealType: MealType;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}
