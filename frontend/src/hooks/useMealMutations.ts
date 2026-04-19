import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../lib/axios'
import { getLineUserId } from '../lib/liff'
import { FoodItem } from './useTodayMeals'

export interface EditMealPayload {
  mealType: string
  items: FoodItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export function useEditMeal(date: string) {
  const queryClient = useQueryClient()
  const lineUserId = getLineUserId()

  return useMutation({
    mutationFn: ({ mealId, data }: { mealId: string; data: EditMealPayload }) =>
      apiClient.put(`/api/records/${lineUserId}/meals/${mealId}?date=${date}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', lineUserId, date] })
      queryClient.invalidateQueries({ queryKey: ['summary', lineUserId, date] })
    },
  })
}

export function useDeleteMeal(date: string) {
  const queryClient = useQueryClient()
  const lineUserId = getLineUserId()

  return useMutation({
    mutationFn: (mealId: string) =>
      apiClient.delete(`/api/records/${lineUserId}/meals/${mealId}?date=${date}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', lineUserId, date] })
      queryClient.invalidateQueries({ queryKey: ['summary', lineUserId, date] })
    },
  })
}
