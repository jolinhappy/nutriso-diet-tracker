import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../lib/axios'
import { getLineUserId } from '../lib/liff'
import { getTaipeiToday } from '../lib/date'

export interface NutritionGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function useUpdateGoals() {
  const queryClient = useQueryClient()
  const lineUserId = getLineUserId()

  return useMutation({
    mutationFn: (goals: NutritionGoals) =>
      apiClient.post(`/api/users/${lineUserId}/goals`, goals),
    onSuccess: () => {
      const today = getTaipeiToday()
      queryClient.invalidateQueries({ queryKey: ['user', lineUserId] })
      queryClient.invalidateQueries({ queryKey: ['meals', lineUserId, today] })
      queryClient.invalidateQueries({ queryKey: ['summary', lineUserId, today] })
    },
  })
}
