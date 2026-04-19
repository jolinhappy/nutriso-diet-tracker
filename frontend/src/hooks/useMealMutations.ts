import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../lib/axios'
import { getLineUserId } from '../lib/liff'
import { FoodItem } from './useTodayMeals'

export type MealType = '早餐' | '午餐' | '晚餐' | '點心' | '宵夜'

export interface ItemWithTarget {
  item: FoodItem
  targetMealType: MealType
}

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

export function useDeleteMealItem(date: string) {
  const queryClient = useQueryClient()
  const lineUserId = getLineUserId()

  return useMutation({
    mutationFn: ({ mealId, itemIndex }: { mealId: string; itemIndex: number }) =>
      apiClient.delete(`/api/records/${lineUserId}/meals/${mealId}/items/${itemIndex}?date=${date}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', lineUserId, date] })
      queryClient.invalidateQueries({ queryKey: ['summary', lineUserId, date] })
    },
  })
}

export function useReorganizeMeal(date: string) {
  const queryClient = useQueryClient()
  const lineUserId = getLineUserId()

  return useMutation({
    mutationFn: ({ mealId, items }: { mealId: string; items: ItemWithTarget[] }) =>
      apiClient.put(`/api/records/${lineUserId}/meals/${mealId}/reorganize?date=${date}`, { items }),
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
