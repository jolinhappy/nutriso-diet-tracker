import { useQuery } from '@tanstack/react-query'
import apiClient from '../lib/axios'
import { getLineUserId } from '../lib/liff'

export interface NutritionGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface User {
  lineUserId: string
  displayName: string
  email: string | null
  dailyGoals: NutritionGoals | null
}

async function fetchUser(lineUserId: string): Promise<User> {
  const res = await apiClient.get<{ success: boolean; data: User }>(
    `/api/users/${lineUserId}`
  )
  return res.data.data!
}

export function useUser() {
  const lineUserId = getLineUserId()

  return useQuery({
    queryKey: ['user', lineUserId],
    queryFn: () => fetchUser(lineUserId!),
    enabled: !!lineUserId,
  })
}
