// 後端型別定義（與 shared/types 保持一致）

export type MealType = '早餐' | '午餐' | '晚餐' | '點心' | '宵夜'

export interface FoodItem {
  name: string
  amount: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface AiParsedMeal {
  mealType: MealType
  items: FoodItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export interface NutritionGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}
