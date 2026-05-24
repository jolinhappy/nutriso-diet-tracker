import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../lib/axios'
import { getLineUserId } from '../lib/liff'
import { MealType } from './useMealMutations'

export interface AddMealPayload {
  date: string
  mealType: MealType
  item: {
    name: string
    amount: string
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export function useAddMeal(date: string) {
  const queryClient = useQueryClient()
  const lineUserId = getLineUserId()

  return useMutation({
    mutationFn: (payload: AddMealPayload) =>
      apiClient.post(`/api/records/${lineUserId}/meals`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', lineUserId, date] })
      queryClient.invalidateQueries({ queryKey: ['summary', lineUserId, date] })
    },
  })
}
