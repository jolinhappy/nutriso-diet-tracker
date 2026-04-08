import { useQuery } from '@tanstack/react-query'
import apiClient from '../lib/axios'
import { getLineUserId } from '../lib/liff'

export interface FoodItem {
  name: string
  amount: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface Meal {
  id: string
  mealType: string
  description: string
  items: FoodItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  createdAt: string
}

export interface DailySummary {
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  remainingCalories: number
  remainingProtein: number
  remainingCarbs: number
  remainingFat: number
}

export interface DailyRecord {
  date: string
  meals: Meal[]
  summary: DailySummary
}

async function fetchDailyRecord(lineUserId: string, date: string): Promise<DailyRecord> {
  const res = await apiClient.get<{ success: boolean; data: DailyRecord }>(
    `/api/records/${lineUserId}/daily/${date}`
  )
  return res.data.data!
}

export function useTodayMeals(date: string) {
  const lineUserId = getLineUserId()
  return useQuery({
    queryKey: ['meals', lineUserId, date],
    queryFn: () => fetchDailyRecord(lineUserId!, date),
    enabled: !!lineUserId,
  })
}
